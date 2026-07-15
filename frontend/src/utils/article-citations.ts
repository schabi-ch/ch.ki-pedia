export interface ChatCitationSegment {
  id: string;
  text: string;
}

const CITATION_BLOCK_SELECTOR = 'p, li, tr, figcaption, blockquote, dd';
const MIN_SEGMENT_TEXT_LENGTH = 12;
const MAX_SEGMENT_TEXT_LENGTH = 5_000;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function headingContext(element: Element, root: HTMLElement): string {
  let heading = '';
  for (const candidate of root.querySelectorAll('h1, h2, h3, h4')) {
    if (candidate.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) {
      const text = normalizeText(candidate.textContent ?? '');
      if (text) heading = text;
    }
  }
  return heading;
}

export function assignCitationSegments(
  root: HTMLElement,
  prefix: 'article' | 'infobox',
): ChatCitationSegment[] {
  root.querySelectorAll('[data-citation-id]').forEach((element) => {
    element.removeAttribute('data-citation-id');
  });

  const candidates = [...root.querySelectorAll<HTMLElement>(CITATION_BLOCK_SELECTOR)]
    .filter((element) => {
      const parentBlock = element.parentElement?.closest(CITATION_BLOCK_SELECTOR);
      return !parentBlock || !root.contains(parentBlock);
    });

  const segments: ChatCitationSegment[] = [];
  for (const element of candidates) {
    const text = normalizeText(element.textContent ?? '');
    if (text.length < MIN_SEGMENT_TEXT_LENGTH) continue;

    const id = `${prefix}-${segments.length + 1}`;
    const heading = prefix === 'article' ? headingContext(element, root) : '';
    const contextualText = heading ? `${heading}: ${text}` : text;
    element.dataset.citationId = id;
    segments.push({
      id,
      text: contextualText.slice(0, MAX_SEGMENT_TEXT_LENGTH),
    });
  }
  return segments;
}

export function citationContextKey(parts: string[]): string {
  let hash = 2166136261;
  for (const char of parts.join('\u0000')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `citation-${(hash >>> 0).toString(36)}`;
}
