// Mirrors frontend/src/utils/branding.ts: the domain decides the brand and
// the language of the texts search engines and link previews show.
const IA_PEDIA_HOSTS = new Set([
  'ia-pedia.ch',
  'ia-pedia.org',
  'wikiped-ia.ch',
  'wikiped-ia.org',
]);
const AI_PEDIA_HOSTS = new Set(['ai-pedia.ch']);

export interface SiteMeta {
  title: string;
  description: string;
  // Link preview image (1200×630), path in frontend/public.
  image: string;
}

export const KI_PEDIA_META: SiteMeta = {
  title: 'ki-pedia.',
  image: '/og/ki-pedia.png',
  description:
    'Ein Bildungsangebot von Wikimedia CH, das Schülerinnen und Schülern mit KI hilft, Wikipedia-Artikel im Unterricht zu vereinfachen, zu lesen und zu erkunden.',
};

export const IA_PEDIA_META: SiteMeta = {
  title: 'ia-pedia.',
  image: '/og/ia-pedia.png',
  description:
    'Un outil pédagogique de Wikimedia CH qui aide les élèves, grâce à l’IA, à simplifier, lire et explorer des articles de Wikipédia en classe.',
};

export const AI_PEDIA_META: SiteMeta = {
  title: 'ai-pedia.',
  image: '/og/ai-pedia.png',
  description:
    'An educational tool by Wikimedia CH that uses AI to help students simplify, read, and explore Wikipedia articles in class.',
};

// Takes a host as returned by resolvePublicHost() (port and www. allowed).
export function resolveSiteMeta(host: string): SiteMeta {
  const hostname = host.replace(/:\d+$/, '').replace(/^www\./, '');
  if (IA_PEDIA_HOSTS.has(hostname)) return IA_PEDIA_META;
  if (AI_PEDIA_HOSTS.has(hostname)) return AI_PEDIA_META;
  return KI_PEDIA_META;
}
