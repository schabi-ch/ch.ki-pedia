/// <reference types="jest" />

import { WikipediaService } from './wikipedia.service';

describe('WikipediaService', () => {
  let originalFetch: typeof global.fetch;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('removes Wikipedia template maintenance links before Markdown conversion', async () => {
    fetchMock.mockResolvedValue(
      createHtmlResponse(`
        <html>
          <body>
            <h1 id="firstHeading">Bahnhof Bern</h1>
            <table class="infobox">
              <tbody><tr><td><a href="./Schweiz">Infobox content</a></td></tr></tbody>
            </table>
            <p>
              Der Bahnhof liegt in <a href="./Schweiz">Schweiz</a>.
              <a href="./Vorlage:Infobox_Bahnhof/Wartung/noH%C3%B6he">i16</a>
            </p>
          </body>
        </html>
      `),
    );
    const service = new WikipediaService();

    const article = await service.getArticle('Bahnhof Bern', 'de');

    expect(article.contentMarkdown).toContain('[Schweiz](/article/Schweiz)');
    expect(article.contentMarkdown).not.toContain('Vorlage');
    expect(article.contentMarkdown).not.toContain('Infobox_Bahnhof');
    expect(article.contentMarkdown).not.toContain('[i16]');
    expect(article.infoboxHtml).toContain('Infobox content');
    expect(article.infoboxHtml).toContain('/article/Schweiz');
    expect(article.contentHtml).not.toContain('class="infobox"');
  });

  it('keeps file links and images inside the infobox', async () => {
    fetchMock.mockResolvedValue(
      createHtmlResponse(`
        <html>
          <body>
            <h1 id="firstHeading">Löwe</h1>
            <table class="infobox">
              <tbody>
                <tr>
                  <td>
                    <a href="./Datei:Lion.jpg" title="Lion image">
                      <img src="//upload.wikimedia.org/lion.jpg" alt="Lion" />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <p>Ein <a href="./Tiger">Tiger</a>.</p>
          </body>
        </html>
      `),
    );
    const service = new WikipediaService();

    const article = await service.getArticle('Löwe', 'de');

    expect(article.infoboxHtml).toContain('<img');
    expect(article.infoboxHtml).toContain(
      'https://de.wikipedia.org/wiki/Datei:Lion.jpg',
    );
    expect(article.infoboxHtml).toContain('https://upload.wikimedia.org/lion.jpg');
    expect(article.contentMarkdown).toContain('[Tiger](/article/Tiger)');
  });

  function createHtmlResponse(html: string): Response {
    return {
      ok: true,
      status: 200,
      text: () => Promise.resolve(html),
    } as Response;
  }
});
