export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

function stripMarkdownInlineSyntax(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`>#]/g, '')
    .trim();
}

export function buildHeadingId(text: string, index: number): string {
  return `h-${index}-${text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;
}

export function extractHeadings(markdown: string): TocHeading[] {
  const lines = markdown.split('\n');
  const headings: TocHeading[] = [];
  let index = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);

    if (!match?.[1] || !match[2]) {
      continue;
    }

    const text = stripMarkdownInlineSyntax(match[2]);

    headings.push({
      level: match[1].length,
      text,
      id: buildHeadingId(text, index),
    });

    index += 1;
  }

  return headings;
}
