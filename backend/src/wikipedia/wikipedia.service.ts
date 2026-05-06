import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

// Inlined from turndown-plugin-gfm (tables only)
const _indexOf = Array.prototype.indexOf;
const _every = Array.prototype.every;

function _isHeadingRow(tr: Element): boolean {
  const parentNode = tr.parentNode as Element;
  return (
    parentNode.nodeName === 'THEAD' ||
    (parentNode.firstChild === tr &&
      (parentNode.nodeName === 'TABLE' || _isFirstTbody(parentNode)) &&
      _every.call(tr.childNodes, (n: Element) => n.nodeName === 'TH'))
  );
}

function _isFirstTbody(element: Element): boolean {
  const previousSibling = element.previousSibling as Element | null;
  return (
    element.nodeName === 'TBODY' &&
    (!previousSibling ||
      (previousSibling.nodeName === 'THEAD' &&
        /^\s*$/i.test(previousSibling.textContent ?? '')))
  );
}

function _cell(content: string, node: Element): string {
  const index = _indexOf.call(
    (node.parentNode as Element).childNodes,
    node,
  );
  const prefix = index === 0 ? '| ' : ' ';
  return prefix + content + ' |';
}

function tables(turndownService: TurndownService): void {
  turndownService.keep(
    (node: Element) =>
      node.nodeName === 'TABLE' &&
      !(node as HTMLTableElement).rows[0] ||
      (node.nodeName === 'TABLE' &&
        !_isHeadingRow((node as HTMLTableElement).rows[0])),
  );
  turndownService.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content: string, node: Node) =>
      _cell(content, node as Element),
  });
  turndownService.addRule('tableRow', {
    filter: 'tr',
    replacement: (content: string, node: Node) => {
      const tr = node as HTMLTableRowElement;
      const alignMap: Record<string, string> = {
        left: ':--',
        right: '--:',
        center: ':-:',
      };
      let borderCells = '';
      if (_isHeadingRow(tr)) {
        for (let i = 0; i < tr.childNodes.length; i++) {
          let border = '---';
          const align = (
            (tr.childNodes[i] as Element).getAttribute?.('align') ?? ''
          ).toLowerCase();
          if (align) border = alignMap[align] ?? border;
          borderCells += _cell(border, tr.childNodes[i] as Element);
        }
      }
      return '\n' + content + (borderCells ? '\n' + borderCells : '');
    },
  });
  turndownService.addRule('table', {
    filter: (node: HTMLElement) =>
      node.nodeName === 'TABLE' &&
      !!(node as HTMLTableElement).rows[0] &&
      _isHeadingRow((node as HTMLTableElement).rows[0]),
    replacement: (content: string) =>
      '\n\n' + content.replace('\n\n', '\n') + '\n\n',
  });
  turndownService.addRule('tableSection', {
    filter: ['thead', 'tbody', 'tfoot'],
    replacement: (content: string) => content,
  });
}

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
  private static readonly NON_ARTICLE_NAMESPACES = new Set([
    'category',
    'catégorie',
    'categoria',
    'datei',
    'file',
    'fichier',
    'help',
    'hilfe',
    'image',
    'kategorie',
    'media',
    'mediawiki',
    'module',
    'modul',
    'modèle',
    'portal',
    'portail',
    'portale',
    'project',
    'special',
    'spezial',
    'template',
    'user',
    'utente',
    'utilisateur',
    'vorlage',
    'wikipedia',
  ]);

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
        const el = node;
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

  private sanitizeWikipediaHtml(
    html: string,
    lang: string,
  ): { html: string; title?: string; infoboxHtml: string } {
    const origin = this.toWikiOrigin(lang);
    const $ = cheerio.load(html);

    // Drop any scripts/styles just in case.
    $('script, style, link[rel="stylesheet"]').remove();

    // Mark Begriffsklärungshinweis div to keep as raw HTML
    $('#Vorlage_Begriffsklärungshinweis').attr('data-keep-html', 'true');

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
          const decodedTitle = decodeURIComponent(titlePart)
            .replace(/_/g, ' ')
            .trim();
          if (this.isNonArticleWikiTitle(decodedTitle)) {
            const namespace = this.getWikiNamespace(decodedTitle);
            if (this.shouldKeepAsExternalWikiLink(namespace)) {
              $(el).attr('href', href);
              $(el).attr('target', '_blank');
              $(el).attr('rel', 'noopener noreferrer');
              return;
            }
            $(el).remove();
            return;
          }
          if (decodedTitle) {
            $(el).attr('href', `/article/${encodeURIComponent(decodedTitle)}`);
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

    // Extract infobox after link and media normalization so infoboxHtml stays usable.
    const infoboxEl = $('.infobox').first();
    const infoboxHtml = infoboxEl.length ? $.html(infoboxEl) : '';
    infoboxEl.remove();

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
      $(tableEl)
        .find('td figure, th figure')
        .each((_, fig) => {
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
    const outHtml = body.length ? (body.html() ?? '') : $.html();
    return { html: outHtml, title, infoboxHtml };
  }

  private isNonArticleWikiTitle(title: string): boolean {
    const namespace = this.getWikiNamespace(title);
    return namespace
      ? WikipediaService.NON_ARTICLE_NAMESPACES.has(namespace)
      : false;
  }

  private getWikiNamespace(title: string): string | undefined {
    return title
      .match(/^([^:]+):/)?.[1]
      ?.trim()
      .toLowerCase();
  }

  private shouldKeepAsExternalWikiLink(namespace: string | undefined): boolean {
    return ['datei', 'file', 'fichier', 'image', 'media'].includes(
      namespace ?? '',
    );
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
          accept: 'text/html; charset=utf-8',
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
    const {
      html: contentHtml,
      title: extractedTitle,
      infoboxHtml,
    } = this.sanitizeWikipediaHtml(rawHtml, safeLang);
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
      if (response.status === 429) {
        return [];
      }
      throw new BadGatewayException(`Wikipedia API error: ${response.status}`);
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
        pages?: Record<string, { langlinks?: { lang: string; '*': string }[] }>;
      };
    };

    const pages = data.query?.pages;
    if (!pages) return [];

    const page = Object.values(pages)[0];
    const links = page?.langlinks ?? [];

    // Include the source language itself
    const result: { lang: string; title: string }[] = [{ lang, title }];

    for (const link of links) {
      result.push({ lang: link.lang, title: link['*'] });
    }

    return result;
  }
}
