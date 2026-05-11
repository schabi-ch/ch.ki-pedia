import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import {
  matchAppendixHeading,
  sortAppendixSections,
  type AppendixKind,
} from './appendix-sections';

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
  const index = _indexOf.call((node.parentNode as Element).childNodes, node);
  const prefix = index === 0 ? '| ' : ' ';
  return prefix + content + ' |';
}

function tables(turndownService: TurndownService): void {
  turndownService.keep(
    (node: Element) =>
      (node.nodeName === 'TABLE' && !(node as HTMLTableElement).rows[0]) ||
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

export interface AppendixSection {
  kind: AppendixKind;
  title: string;
  markdown: string;
}

export interface WikiArticle {
  title: string;
  contentMarkdown: string;
  contentHtml: string;
  infoboxHtml: string;
  appendixSections: AppendixSection[];
  url: string;
}

export interface WikiSuggestion {
  title: string;
  description: string;
  thumbnail: string | null;
  pageid: number;
}

export interface WikiArticleLanguageLink {
  lang: string;
  title: string;
  wikiLang: string;
  langName?: string;
  autonym?: string;
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
  private static readonly WIKIPEDIA_USER_AGENT =
    process.env.WIKIPEDIA_USER_AGENT ??
    'ch.ki-pedia/1.0 (https://github.com/schabi-ch/ch.ki-pedia)';

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

  private normalizeWikiLang(lang?: string): string {
    const candidate = (lang ?? 'en').trim().toLowerCase();
    return /^[a-z][a-z0-9-]{0,14}$/.test(candidate) ? candidate : 'en';
  }

  private extractWikiSubdomain(url: string): string | undefined {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const match = hostname.match(/^([a-z0-9-]+)\.wikipedia\.org$/);
      return match?.[1];
    } catch {
      return undefined;
    }
  }

  private getBaseUrl(lang: string): string {
    const safeLang = this.normalizeWikiLang(lang);
    return `https://${safeLang}.wikipedia.org/w/api.php`;
  }

  private getRestBaseUrl(lang: string): string {
    const safeLang = this.normalizeWikiLang(lang);
    return `https://${safeLang}.wikipedia.org/api/rest_v1`;
  }

  private toWikiOrigin(lang: string): string {
    const safeLang = this.normalizeWikiLang(lang);
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
  ): {
    html: string;
    title?: string;
    infoboxHtml: string;
    appendixHtml: Array<{ kind: AppendixKind; title: string; html: string }>;
  } {
    const origin = this.toWikiOrigin(lang);
    const $ = cheerio.load(html);

    // Drop any scripts/styles just in case.
    $('script, style, link[rel="stylesheet"]').remove();

    // Remove Parsoid metadata attributes that should never be user-visible.
    $('*[about], *[typeof], *[data-mw], *[data-parsoid]').each((_, el) => {
      const node = $(el);
      node.removeAttr('about');
      node.removeAttr('typeof');
      node.removeAttr('data-mw');
      node.removeAttr('data-parsoid');
    });

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

    // Extract appendix sections (Literatur/Weblinks/Einzelnachweise etc.).
    // They are removed from the main HTML so they neither appear in the
    // rendered article body nor in the Markdown sent to LLM endpoints.
    const appendixHtml: Array<{
      kind: AppendixKind;
      title: string;
      html: string;
    }> = [];
    $('h2').each((_, h2) => {
      const headingText = $(h2).text().trim();
      if (!headingText) return;
      const kind = matchAppendixHeading(headingText, lang);
      if (!kind) return;

      // Prefer the enclosing Parsoid <section data-mw-section-id> wrapper.
      const parsoidSection = $(h2).closest('section[data-mw-section-id]');
      if (parsoidSection.length) {
        const sectionHtml = $.html(parsoidSection);
        appendixHtml.push({ kind, title: headingText, html: sectionHtml });
        parsoidSection.remove();
        return;
      }

      // Fallback: collect the h2 itself plus all following siblings up to the
      // next h2.
      const collected: string[] = [];
      collected.push($.html(h2));
      let sibling = $(h2).next();
      while (sibling.length && sibling[0].tagName !== 'h2') {
        collected.push($.html(sibling));
        const next = sibling.next();
        sibling.remove();
        sibling = next;
      }
      $(h2).remove();
      appendixHtml.push({
        kind,
        title: headingText,
        html: collected.join('\n'),
      });
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
      $(tableEl)
        .find('td figure:not(:has(figcaption)), th figure:not(:has(figcaption))')
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
    return { html: outHtml, title, infoboxHtml, appendixHtml };
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

  private async fetchWikipedia(
    url: string,
    init: RequestInit = {},
    retries = 1,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    if (!headers.has('user-agent')) {
      headers.set('user-agent', WikipediaService.WIKIPEDIA_USER_AGENT);
    }

    const response = await fetch(url, {
      ...init,
      headers,
    });

    if ((response.status === 429 || response.status === 503) && retries > 0) {
      const retryAfter = Number.parseInt(
        response.headers.get('retry-after') ?? '',
        10,
      );
      const delayMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 2000)
          : 250;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.fetchWikipedia(url, init, retries - 1);
    }

    return response;
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

    const response = await this.fetchWikipedia(`${baseUrl}?${params}`);
    if (!response.ok) {
      if (response.status === 429) {
        return [];
      }
      throw new BadGatewayException(`Wikipedia API error: ${response.status}`);
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
    const safeLang = this.normalizeWikiLang(lang);
    const restBaseUrl = this.getRestBaseUrl(safeLang);

    // Structured HTML (Parsoid) including headings, links, tables, images.
    const htmlRes = await this.fetchWikipedia(
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
      appendixHtml,
    } = this.sanitizeWikipediaHtml(rawHtml, safeLang);
    const contentMarkdown = this.convertHtmlToMarkdown(contentHtml);
    const appendixSections = sortAppendixSections(
      appendixHtml.map((s) => ({
        kind: s.kind,
        title: s.title,
        markdown: this.convertHtmlToMarkdown(s.html).trim(),
      })),
    ).filter((s) => s.markdown.length > 0);

    const finalTitle = extractedTitle ?? title;
    return {
      title: finalTitle,
      contentMarkdown,
      contentHtml,
      infoboxHtml,
      appendixSections,
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

    const response = await this.fetchWikipedia(`${baseUrl}?${params}`);
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
  ): Promise<WikiArticleLanguageLink[]> {
    const safeLang = this.normalizeWikiLang(lang);
    const baseUrl = this.getBaseUrl(safeLang);

    const decodeTitleSafely = (value: string): string => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const normalizedInput = decodeTitleSafely(title).replace(/_/g, ' ').trim();
    const titleCandidates = Array.from(
      new Set([title, normalizedInput, normalizedInput.normalize('NFC')]),
    ).filter((candidate) => candidate.length > 0);

    for (const candidate of titleCandidates) {
      const params = new URLSearchParams({
        action: 'query',
        titles: candidate,
        prop: 'langlinks',
        lllimit: '500',
        format: 'json',
        origin: '*',
      });

      try {
        const response = await this.fetchWikipedia(`${baseUrl}?${params}`);
        if (!response.ok) {
          continue;
        }

        const data = (await response.json()) as {
          query?: {
            pages?: Record<
              string,
              {
                langlinks?: {
                  lang: string;
                  url?: string;
                  langname?: string;
                  autonym?: string;
                  '*': string;
                }[];
              }
            >;
          };
        };

        const pages = data.query?.pages;
        if (!pages) {
          continue;
        }

        const page = Object.values(pages)[0];
        const links = page?.langlinks ?? [];

        const result: WikiArticleLanguageLink[] = [
          {
            lang: safeLang,
            title: candidate,
            wikiLang: safeLang,
          },
        ];

        for (const link of links) {
          result.push({
            lang: link.lang,
            title: link['*'],
            wikiLang: this.extractWikiSubdomain(link.url ?? '') ?? link.lang,
            langName: link.langname,
            autonym: link.autonym,
          });
        }

        return result;
      } catch {
        // Try the next title candidate.
      }
    }

    return [
      {
        lang: safeLang,
        title: normalizedInput || title,
        wikiLang: safeLang,
      },
    ];
  }
}
