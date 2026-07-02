export type GradeSectionLevel = 1 | 2 | 3;

export interface GradeArticleSection {
  id: string;
  level: GradeSectionLevel;
  title: string;
  markdown: string;
  bodyMarkdown: string;
}

const GRADE_HEADING_RE = /^##\s+(Level|Niveau|Livello|Nivel)\s+([123])(?:\b|\s|[-–:]).*$/i;

interface HeadingMatch {
  lineIndex: number;
  level: GradeSectionLevel;
  title: string;
}

export function splitGradeSections (markdown: string): GradeArticleSection[] {
  const text = String(markdown ?? '').trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const headings: HeadingMatch[] = [];

  lines.forEach((line, lineIndex) => {
    const match = GRADE_HEADING_RE.exec(line.trim());
    if (!match) return;
    headings.push({
      lineIndex,
      level: Number(match[2]) as GradeSectionLevel,
      title: line.replace(/^##\s+/, '').trim(),
    });
  });

  if (headings.length !== 3) return [];
  if (!headings.every((heading, index) => heading.level === index + 1)) return [];

  return headings.map((heading, index) => {
    const nextHeading = headings[index + 1];
    const sectionLines = lines.slice(
      heading.lineIndex,
      nextHeading?.lineIndex ?? lines.length,
    );
    const bodyLines = sectionLines.slice(1);
    return {
      id: `grade-section-${heading.level}`,
      level: heading.level,
      title: heading.title,
      markdown: sectionLines.join('\n').trim(),
      bodyMarkdown: bodyLines.join('\n').trim(),
    };
  });
}
