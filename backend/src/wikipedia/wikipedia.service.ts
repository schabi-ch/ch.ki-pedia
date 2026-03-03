import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

interface WikiSearchItem {
  title: string;
  snippet: string;
  pageid: number;
}

interface WikiSearchResponse {
  query: {
    search: WikiSearchItem[];
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
}

export interface WikiArticle {
  title: string;
  content: string;
  contentHtml: string;
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

  private sanitizeWikipediaHtml(html: string, lang: string): { html: string; title?: string } {
    const origin = this.toWikiOrigin(lang);
    const $ = cheerio.load(html);

    // Drop any scripts/styles just in case.
    $('script, style, link[rel="stylesheet"]').remove();

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

    const title = $('#firstHeading').first().text().trim() || undefined;

    // Return body contents if present, otherwise the whole document.
    const body = $('body');
    const outHtml = body.length ? body.html() ?? '' : $.html();
    return { html: outHtml, title };
  }

  private extractPlainTextFromHtml(html: string): string {
    const $ = cheerio.load(html);
    $('script, style, link[rel="stylesheet"]').remove();
    // Avoid dumping table content too aggressively; keep main flow.
    $('table').remove();

    const text = $('body').length ? $('body').text() : $.text();
    return text
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  async search(query: string, lang = 'en'): Promise<WikiSearchResult[]> {
    const baseUrl = this.getBaseUrl(lang);
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      srlimit: '10',
      origin: '*',
    });

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    const data = (await response.json()) as WikiSearchResponse;

    return data.query.search.map((item) => ({
      title: item.title,
      snippet: item.snippet.replace(/[<>]/g, ''),
      pageid: item.pageid,
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
      throw new Error(`Wikipedia REST API error: ${htmlRes.status}`);
    }
    const rawHtml = await htmlRes.text();
    const { html: contentHtml, title: extractedTitle } =
      this.sanitizeWikipediaHtml(rawHtml, safeLang);
    const content = this.extractPlainTextFromHtml(rawHtml);

    const finalTitle = extractedTitle ?? title;
    return {
      title: finalTitle,
      content,
      contentHtml,
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
}
