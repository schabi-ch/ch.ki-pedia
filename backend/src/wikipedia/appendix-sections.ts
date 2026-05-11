/**
 * Wikipedia appendix sections (Literatur/Weblinks/Einzelnachweise etc.) that
 * appear at the end of articles and are not part of the main content. These are
 * extracted from the HTML before Markdown conversion so they can be displayed
 * separately in the UI and excluded from LLM requests (simplify/translate/chat).
 */

export type AppendixKind =
  | 'bibliography'
  | 'see_also'
  | 'notes_misc'
  | 'external_links'
  | 'references';

/** Display order for the extracted sections. */
export const APPENDIX_ORDER: AppendixKind[] = [
  'bibliography',
  'see_also',
  'notes_misc',
  'external_links',
  'references',
];

/**
 * Heading titles per language, mapped to the canonical appendix kind.
 * Matching is case-insensitive and whitespace-tolerant (see {@link normalizeHeading}).
 */
const APPENDIX_HEADINGS: Record<string, Record<string, AppendixKind>> = {
  de: {
    literatur: 'bibliography',
    weblinks: 'external_links',
    einzelnachweise: 'references',
    nachweise: 'references',
    belege: 'references',
    'siehe auch': 'see_also',
    anmerkungen: 'notes_misc',
    fußnoten: 'notes_misc',
    fussnoten: 'notes_misc',
    quellen: 'notes_misc',
  },
  fr: {
    bibliographie: 'bibliography',
    'liens externes': 'external_links',
    références: 'references',
    'notes et références': 'references',
    'voir aussi': 'see_also',
    annexes: 'see_also',
    notes: 'notes_misc',
  },
  it: {
    bibliografia: 'bibliography',
    'collegamenti esterni': 'external_links',
    note: 'references',
    'voci correlate': 'see_also',
    'vedi anche': 'see_also',
    'altri progetti': 'notes_misc',
  },
  rm: {
    bibliografia: 'bibliography',
    'lincs externs': 'external_links',
    'colliaziuns externas': 'external_links',
    referenzas: 'references',
    annotaziuns: 'references',
    'vesair era': 'see_also',
  },
  en: {
    bibliography: 'bibliography',
    'further reading': 'bibliography',
    'external links': 'external_links',
    references: 'references',
    'notes and references': 'references',
    'see also': 'see_also',
    notes: 'notes_misc',
  },
};

function normalizeHeading(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Returns the canonical {@link AppendixKind} for a heading title in a given
 * language, or `undefined` if the heading is not an appendix section.
 */
export function matchAppendixHeading(
  headingText: string,
  lang: string,
): AppendixKind | undefined {
  const map = APPENDIX_HEADINGS[lang] ?? APPENDIX_HEADINGS.en;
  return map[normalizeHeading(headingText)];
}

/**
 * Sorts appendix sections into the canonical display order. Stable for
 * duplicates within the same kind (preserves DOM order between them).
 */
export function sortAppendixSections<T extends { kind: AppendixKind }>(
  sections: T[],
): T[] {
  const orderIndex = new Map(APPENDIX_ORDER.map((k, i) => [k, i]));
  return [...sections].sort(
    (a, b) => (orderIndex.get(a.kind) ?? 99) - (orderIndex.get(b.kind) ?? 99),
  );
}
