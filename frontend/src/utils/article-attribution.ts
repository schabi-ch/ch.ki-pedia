// Wikipedia content is licensed under CC BY-SA 4.0, which requires a link to
// the source, credit to the authors (the article history lists them) and a
// licence notice wherever the text or an adaptation of it is shown.

export const WIKIPEDIA_LICENSE_NAME = 'CC BY-SA 4.0';
export const WIKIPEDIA_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

export interface WikipediaAttributionLinks {
  articleUrl: string;
  historyUrl: string;
  licenseUrl: string;
}

export function wikipediaAttributionLinks (article: { title: string; url: string }): WikipediaAttributionLinks {
  let origin = '';
  try {
    origin = new URL(article.url).origin;
  } catch {
    origin = 'https://wikipedia.org';
  }
  const pageTitle = encodeURIComponent(article.title.replace(/ /g, '_'));
  return {
    articleUrl: article.url,
    historyUrl: `${origin}/w/index.php?title=${pageTitle}&action=history`,
    licenseUrl: WIKIPEDIA_LICENSE_URL,
  };
}
