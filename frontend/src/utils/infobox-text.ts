const MAX_INFOBOX_TEXT_LENGTH = 50_000;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function textFromElement(element: Element): string {
  return normalizeWhitespace(element.textContent ?? '');
}

export function infoboxHtmlToText(html: string): string {
  if (!html.trim() || typeof DOMParser === 'undefined') {
    return '';
  }

  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(html, 'text/html');

  parsedDocument
    .querySelectorAll('script, style, link, source, img, svg, noscript')
    .forEach((element) => element.remove());

  const lines: string[] = [];

  parsedDocument.querySelectorAll('table tr').forEach((row) => {
    const cells = Array.from(row.querySelectorAll('th, td'))
      .map(textFromElement)
      .filter(Boolean);

    if (cells.length > 0) {
      lines.push(cells.join(': '));
    }

    row.remove();
  });

  const remainingText = textFromElement(parsedDocument.body);
  if (remainingText) {
    lines.push(remainingText);
  }

  return lines
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join('\n')
    .slice(0, MAX_INFOBOX_TEXT_LENGTH)
    .trim();
}
