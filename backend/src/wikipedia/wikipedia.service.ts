import { Injectable } from '@nestjs/common';

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
  url: string;
}

@Injectable()
export class WikipediaService {
  private readonly baseUrl = 'https://en.wikipedia.org/w/api.php';

  async search(query: string): Promise<WikiSearchResult[]> {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      srlimit: '10',
      origin: '*',
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
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

  async getArticle(title: string): Promise<WikiArticle> {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'extracts',
      titles: title,
      format: 'json',
      explaintext: '1',
      exsectionformat: 'plain',
      origin: '*',
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    const data = (await response.json()) as WikiExtractResponse;

    const pages = data.query.pages;
    const page = Object.values(pages)[0];

    return {
      title: page.title,
      content: page.extract ?? '',
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    };
  }
}
