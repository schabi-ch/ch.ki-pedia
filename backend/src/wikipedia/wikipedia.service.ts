import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { tables } from 'turndown-plugin-gfm';

interface WikiGeneratorSearchPage {
  pageid: number;
  title: string;
  index?: number;
  thumbnail?: { source?: string };
}

interface WikiGeneratorSearchResponse {
  query?: {
    pages: Record<string, WikiGeneratorSearchPage>;
    searchinfo?: { totalhits?: number };
  };
}

interface WikiPage {
  title: string;
  extract: string;
  pageid: number;
}

interface WikiExtractResponse {
  query: {
    pages: Record<string, WikiPage>;
  };
}

export interface WikiSearchResult {
  title: string;
  snippet: string;
  pageid: number;
  thumbnail: string | null;
}

export interface WikiArticle {
  title: string;
  contentMarkdown: string;
  contentHtml: string;
  infoboxHtml: string;
  url: string;
}

export interface WikiSuggestion {
  title: string;
  description: string;
  thumbnail: string | null;
  pageid: number;
}

interface WikiPrefixPage {
  index?: number;
  pageid: number;
  title: string;
  terms?: { description?: string[] };
  thumbnail?: { source?: string };
}

interface WikiPrefixResponse {
  query?: {
    pages: Record<string, WikiPrefixPage>;
  };
}

@Injectable()
export class WikipediaService {
  private readonly supportedLangs = ['en', 'de', 'fr', 'it', 'rm'];
  private readonly turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  constructor() {
    this.turndown.use(tables);
    this.turndown.keep(['figure', 'figcaption']);
    this.turndown.addRule('begriffsklärung', {
      filter: (node) =>
        node.nodeName === 'DIV' &&
        node.getAttribute('data-keep-html') === 'true',
      replacement: (_content, node) => {
        const el = node as HTMLElement;
        el.removeAttribute('data-keep-html');
        return '\n\n' + el.outerHTML + '\n\n';
      },
    });
  }

  private getBaseUrl(lang: string): string {
    const safeLang = this.supportedLangs.includes(lang) ? lang : 'en';
    return `https://${safeLang}.wikipedia.org/w/api.php`;
  }

  private getRestBaseUrl(lang: string): string {
    const safeLang = this.supportedLangs.includes(lang) ? lang : 'en';
    return `https://${safeLang}.wikipedia.org/api/rest_v1`;
  }

  private toWikiOrigin(lang: string): string {
    const safeLang = this.supportedLangs.includes(lang) ? lang : 'en';
    return `https://${safeLang}.wikipedia.org`;
  }

  private rewriteSrcset(srcset: string): string {
    // Convert protocol-relative URLs (//...) to https://...
    return srcset
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        if (trimmed.startsWith('//')) return `https:${trimmed}`;
        return trimmed;
      })
      .join(', ');
  }

  private sanitizeWikipediaHtml(html: string, lang: string): { html: string; title?: string; infoboxHtml: string } {
    const origin = this.toWikiOrigin(lang);
    const $ = cheerio.load(html);

    // Drop any scripts/styles just in case.
    $('script, style, link[rel="stylesheet"]').remove();

    // Mark Begriffsklärungshinweis div to keep as raw HTML
    $('#Vorlage_Begriffsklärungshinweis').attr('data-keep-html', 'true');

    // Extract infobox before markdown conversion
    const infoboxEl = $('.infobox').first();
    const infoboxHtml = infoboxEl.length ? $.html(infoboxEl) : '';
    infoboxEl.remove();

    // Make links absolute and rewrite Wikipedia article links to internal routes.
    $('a[href]').each((_, el) => {
      const rawHref = $(el).attr('href');
      if (!rawHref) return;

      // Keep in-page anchors as-is.
      if (rawHref.startsWith('#')) {
        $(el).removeAttr('target');
        $(el).removeAttr('rel');
        return;
      }

      const normalizeToAbsolute = (href: string): string => {
        if (href.startsWith('//')) return `https:${href}`;
        if (href.startsWith('/')) return `${origin}${href}`;
        return href;
      };

      // Parsoid sometimes emits relative "./Title" links.
      const href = rawHref.startsWith('./')
        ? `${origin}/wiki/${rawHref.slice(2)}`
        : normalizeToAbsolute(rawHref);

      const wikiPrefix = `${origin}/wiki/`;
      const isWikiArticleLink = href.startsWith(wikiPrefix);

      // Links inside <figure> always open as external Wikipedia links.
      if ($(el).closest('figure').length > 0) {
        $(el).attr('href', href);
        $(el).attr('target', '_blank');
        $(el).attr('rel', 'noopener noreferrer');
        return;
      }

      if (isWikiArticleLink) {
        const afterPrefix = href.slice(wikiPrefix.length);
        const titlePart = afterPrefix.split(/[?#]/, 1)[0] ?? '';
        try {
          const decodedTitle = decodeURIComponent(titlePart).replace(/_/g, ' ').trim();
          if (decodedTitle) {
            // Hash-mode router: internal route is #/article/:title
            $(el).attr('href', `#/article/${encodeURIComponent(decodedTitle)}`);
            $(el).removeAttr('target');
            $(el).removeAttr('rel');
            return;
          }
        } catch {
          // fall through to external handling
        }
      }

      // External link: open new tab.
      $(el).attr('href', href);
      $(el).attr('target', '_blank');
      $(el).attr('rel', 'noopener noreferrer');
    });

    // Make image URLs absolute.
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (!src) return;
      if (src.startsWith('//')) {
        $(el).attr('src', `https:${src}`);
        return;
      }
      if (src.startsWith('/')) {
        $(el).attr('src', `${origin}${src}`);
      }
    });

    $('img[srcset]').each((_, el) => {
      const srcset = $(el).attr('srcset');
      if (!srcset) return;
      $(el).attr('srcset', this.rewriteSrcset(srcset));
    });
    $('source[srcset]').each((_, el) => {
      const srcset = $(el).attr('srcset');
      if (!srcset) return;
      $(el).attr('srcset', this.rewriteSrcset(srcset));
    });

    // Pre-process tables for cleaner Markdown conversion.
    $('table').each((_, tableEl) => {
      // Move <caption> text above the table as a bold paragraph.
      const caption = $(tableEl).find('caption').first();
      if (caption.length) {
        caption.find('button').remove();
        const captionText = caption.text().trim();
        if (captionText) {
          $(tableEl).before(`<p><strong>${captionText}</strong></p>`);
        }
        caption.remove();
      }
      // Unwrap <figure> in table cells to a plain <img> so pipe tables stay clean.
      $(tableEl).find('td figure, th figure').each((_, fig) => {
        const img = $(fig).find('img').first();
        if (img.length) {
          $(fig).replaceWith(img);
        } else {
          $(fig).remove();
        }
      });
      // Remove citation superscripts inside table cells for cleaner output.
      $(tableEl).find('td sup.reference, th sup.reference').remove();
    });

    const title = $('#firstHeading').first().text().trim() || undefined;

    // Return body contents if present, otherwise the whole document.
    const body = $('body');
    const outHtml = body.length ? body.html() ?? '' : $.html();
    return { html: outHtml, title, infoboxHtml };
  }

  private convertHtmlToMarkdown(html: string): string {
    return this.turndown.turndown(html);
  }

  async search(query: string, lang = 'en'): Promise<WikiSearchResult[]> {
    const baseUrl = this.getBaseUrl(lang);
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: '10',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '80',
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    const data = (await response.json()) as WikiGeneratorSearchResponse;

    if (!data.query?.pages) {
      return [];
    }

    return Object.values(data.query.pages)
      .sort((a, b) => {
        const ai = a.index ?? Number.MAX_SAFE_INTEGER;
        const bi = b.index ?? Number.MAX_SAFE_INTEGER;
        return ai - bi;
      })
      .map((page) => ({
        title: page.title,
        snippet: '',
        pageid: page.pageid,
        thumbnail: page.thumbnail?.source ?? null,
      }));
  }

  async getArticle(title: string, lang = 'en'): Promise<WikiArticle> {
    const safeLang = this.supportedLangs.includes(lang) ? lang : 'en';
    const restBaseUrl = this.getRestBaseUrl(safeLang);

    // Structured HTML (Parsoid) including headings, links, tables, images.
    const htmlRes = await fetch(
      `${restBaseUrl}/page/html/${encodeURIComponent(title)}`,
      {
        headers: {
          // Helps Wikipedia return a consistent representation.
          'accept': 'text/html; charset=utf-8',
        },
      },
    );
    if (!htmlRes.ok) {
      if (htmlRes.status === 404) {
        throw new NotFoundException(`Wikipedia article not found: ${title}`);
      }
      throw new BadGatewayException(
        `Wikipedia REST API error: ${htmlRes.status}`,
      );
    }
    const rawHtml = await htmlRes.text();
    const { html: contentHtml, title: extractedTitle, infoboxHtml } =
      this.sanitizeWikipediaHtml(rawHtml, safeLang);
    const contentMarkdown = this.convertHtmlToMarkdown(contentHtml);

    const finalTitle = extractedTitle ?? title;
    return {
      title: finalTitle,
      contentMarkdown,
      contentHtml,
      infoboxHtml,
      url: `https://${safeLang}.wikipedia.org/wiki/${encodeURIComponent(finalTitle)}`,
    };
  }

  async prefixSearch(query: string, lang = 'en'): Promise<WikiSuggestion[]> {
    const baseUrl = this.getBaseUrl(lang);
    const params = new URLSearchParams({
      action: 'query',
      generator: 'prefixsearch',
      gpssearch: query,
      gpslimit: '10',
      prop: 'pageimages|pageterms',
      piprop: 'thumbnail',
      pithumbsize: '60',
      wbptterms: 'description',
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    const data = (await response.json()) as WikiPrefixResponse;

    if (!data.query?.pages) {
      return [];
    }

    const pages = Object.values(data.query.pages);

    return pages
      .sort((a, b) => {
        const ai = a.index ?? Number.MAX_SAFE_INTEGER;
        const bi = b.index ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return a.title.localeCompare(b.title);
      })
      .map((p) => ({
        title: p.title,
        description: p.terms?.description?.[0] ?? '',
        thumbnail: p.thumbnail?.source ?? null,
        pageid: p.pageid,
      }));
  }

  async getLanguageLinks(
    title: string,
    lang = 'en',
  ): Promise<{ lang: string; title: string }[]> {
    const baseUrl = this.getBaseUrl(lang);
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'langlinks',
      lllimit: '500',
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    const data = (await response.json()) as {
      query?: {
        pages?: Record<
          string,
          { langlinks?: { lang: string; '*': string }[] }
        >;
      };
    };

    const pages = data.query?.pages;
    if (!pages) return [];

    const page = Object.values(pages)[0];
    const links = page?.langlinks ?? [];

    // Include the source language itself
    const result: { lang: string; title: string }[] = [
      { lang, title },
    ];

    for (const link of links) {
      result.push({ lang: link.lang, title: link['*'] });
    }

    return result;
  }
}
