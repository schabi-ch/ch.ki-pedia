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
    expect(article.infoboxHtml).toContain(
      'https://upload.wikimedia.org/lion.jpg',
    );
    expect(article.contentMarkdown).toContain('[Tiger](/article/Tiger)');
  });

  it('extracts German appendix sections (Literatur/Weblinks/Einzelnachweise)', async () => {
    fetchMock.mockResolvedValue(
      createHtmlResponse(`
        <html>
          <body>
            <h1 id="firstHeading">Albert Einstein</h1>
            <section data-mw-section-id="0">
              <p>Albert Einstein war ein <a href="./Physiker">Physiker</a>.</p>
            </section>
            <section data-mw-section-id="1">
              <h2>Literatur</h2>
              <ul><li>Some book about Einstein</li></ul>
            </section>
            <section data-mw-section-id="2">
              <h2>Weblinks</h2>
              <ul><li><a href="https://example.com">External</a></li></ul>
            </section>
            <section data-mw-section-id="3">
              <h2>Einzelnachweise</h2>
              <ol><li>Reference one</li></ol>
            </section>
          </body>
        </html>
      `),
    );
    const service = new WikipediaService();

    const article = await service.getArticle('Albert Einstein', 'de');

    expect(article.contentMarkdown).toContain('Physiker');
    expect(article.contentMarkdown).not.toContain('Literatur');
    expect(article.contentMarkdown).not.toContain('Weblinks');
    expect(article.contentMarkdown).not.toContain('Einzelnachweise');
    expect(article.contentMarkdown).not.toContain('Some book about Einstein');

    expect(article.appendixSections).toHaveLength(3);
    // Canonical order: bibliography, external_links, references
    expect(article.appendixSections[0]).toMatchObject({
      kind: 'bibliography',
      title: 'Literatur',
    });
    expect(article.appendixSections[0]?.markdown).toContain(
      'Some book about Einstein',
    );
    expect(article.appendixSections[1]).toMatchObject({
      kind: 'external_links',
      title: 'Weblinks',
    });
    expect(article.appendixSections[2]).toMatchObject({
      kind: 'references',
      title: 'Einzelnachweise',
    });
  });

  it('recognises French appendix headings including "Notes et références"', async () => {
    fetchMock.mockResolvedValue(
      createHtmlResponse(`
        <html>
          <body>
            <h1 id="firstHeading">Genève</h1>
            <section data-mw-section-id="0">
              <p>Genève est une ville.</p>
            </section>
            <section data-mw-section-id="1">
              <h2>Notes et références</h2>
              <ol><li>ref one</li></ol>
            </section>
            <section data-mw-section-id="2">
              <h2>Voir aussi</h2>
              <p>Articles connexes.</p>
            </section>
            <section data-mw-section-id="3">
              <h2>Liens externes</h2>
              <ul><li><a href="https://example.org">Site officiel</a></li></ul>
            </section>
          </body>
        </html>
      `),
    );
    const service = new WikipediaService();

    const article = await service.getArticle('Genève', 'fr');

    expect(article.contentMarkdown).not.toContain('Notes et références');
    expect(article.contentMarkdown).not.toContain('Voir aussi');
    expect(article.contentMarkdown).not.toContain('Liens externes');

    const kinds = article.appendixSections.map((s) => s.kind);
    // Canonical order: see_also, external_links, references
    expect(kinds).toEqual(['see_also', 'external_links', 'references']);
    expect(
      article.appendixSections.find((s) => s.kind === 'references')?.title,
    ).toBe('Notes et références');
  });

  it('matches appendix headings case-insensitively and trimmed', async () => {
    fetchMock.mockResolvedValue(
      createHtmlResponse(`
        <html>
          <body>
            <h1 id="firstHeading">Test</h1>
            <section data-mw-section-id="0"><p>Body.</p></section>
            <section data-mw-section-id="1">
              <h2>  BIBLIOGRAFIA  </h2>
              <p>libro</p>
            </section>
          </body>
        </html>
      `),
    );
    const service = new WikipediaService();

    const article = await service.getArticle('Test', 'it');

    expect(article.appendixSections).toHaveLength(1);
    expect(article.appendixSections[0]?.kind).toBe('bibliography');
  });

  it('strips Parsoid metadata but keeps layout spans for complex content', async () => {
    fetchMock.mockResolvedValue(
      createHtmlResponse(`
        <html>
          <body>
            <h1 id="firstHeading">Österreich</h1>
            <p>
              <span class="notheme" style="position:relative; z-index:9; color:#202122;" about="#mwt99" typeof="mw:ExpandedAttrs" data-mw='{"attribs":[[{"txt":"style"},{"html":"<span typeof="mw:Nowiki">position:relative;</span>"}]]}'>Krems</span>
              <span class="notheme" style="position:relative; z-index:9; color:#202122;" about="#mwt103" typeof="mw:ExpandedAttrs" data-mw='{"attribs":[[{"txt":"style"},{"html":"<span typeof="mw:Nowiki">position:relative;</span>"}]]}'>Wiener Neustadt</span>
            </p>
          </body>
        </html>
      `),
    );
    const service = new WikipediaService();

    const article = await service.getArticle('Österreich', 'de');

    expect(article.contentMarkdown).toContain('Krems');
    expect(article.contentMarkdown).toContain('Wiener Neustadt');
    expect(article.contentMarkdown).not.toContain('mw:ExpandedAttrs');
    expect(article.contentMarkdown).not.toContain('data-mw');
    expect(article.contentHtml).toContain('<span class="notheme"');
    expect(article.contentHtml).toContain('style="position:relative; z-index:9; color:#202122;"');
    expect(article.contentHtml).not.toContain('typeof="mw:ExpandedAttrs"');
    expect(article.contentHtml).not.toContain('data-mw=');
    expect(article.contentHtml).not.toContain('about="#mwt');
  });

  it('keeps complex floating map-like boxes in sanitized html', async () => {
    fetchMock.mockResolvedValue(
      createHtmlResponse(`
        <html>
          <body>
            <h1 id="firstHeading">Österreich</h1>
            <table style="
              float:right;
              width:min-content;
              border-collapse:collapse;
            " typeof="mw:Transclusion" data-mw='{"parts":[]}'>
              <tbody>
                <tr>
                  <td>
                    <div style="position:relative; z-index:0; width:max-content;">
                      <img src="//upload.wikimedia.org/map.png" alt="Map" />
                      <div style="
                        position:absolute;
                        top:34.2%;
                        left:89.4%;
                        height:0;
                        width:0;
                      " about="#mwt36" typeof="mw:ExpandedAttrs" data-mw='{"attribs":[]}'>
                        <table style="
                          position:absolute;
                          width:6em;
                          left:-3em;
                        ">
                          <tbody><tr><td><span class="notheme" style="position:relative; z-index:9; color:#202122;" about="#mwt99" typeof="mw:ExpandedAttrs" data-mw='{"attribs":[]}'>Krems</span></td></tr></tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p>Fließtext unter der Karte.</p>
          </body>
        </html>
      `),
    );
    const service = new WikipediaService();

    const article = await service.getArticle('Österreich', 'de');

    expect(article.contentHtml).toContain('float:right');
    expect(article.contentHtml).toContain('width:min-content');
    expect(article.contentHtml).toContain('position:absolute');
    expect(article.contentHtml).toContain('top:34.2%');
    expect(article.contentHtml).toContain('left:89.4%');
    expect(article.contentHtml).toContain('<span class="notheme"');
    expect(article.contentHtml).toContain('Krems');
    expect(article.contentHtml).toContain('https://upload.wikimedia.org/map.png');
    expect(article.contentMarkdown).toContain('Fließtext unter der Karte.');
    expect(article.contentHtml).not.toContain('typeof="mw:ExpandedAttrs"');
    expect(article.contentHtml).not.toContain('data-mw=');
    expect(article.contentHtml).not.toContain('about="#mwt');
  });

  it('returns an empty search result on Wikipedia rate limit (429)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers(),
    } as Response);

    const service = new WikipediaService();

    await expect(service.search('Albert Einstein', 'de')).resolves.toEqual([]);
  });

  it('retries search once after 429 and returns results on success', async () => {
    jest.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                '1': {
                  pageid: 1,
                  title: 'Albert Einstein',
                  index: 0,
                },
              },
            },
          }),
      } as Response);

    const service = new WikipediaService();
    const promise = service.search('Albert Einstein', 'de');

    await jest.advanceTimersByTimeAsync(300);
    await expect(promise).resolves.toEqual([
      {
        title: 'Albert Einstein',
        snippet: '',
        pageid: 1,
        thumbnail: null,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  function createHtmlResponse(html: string): Response {
    return {
      ok: true,
      status: 200,
      text: () => Promise.resolve(html),
    } as Response;
  }
});
