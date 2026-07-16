const IA_PEDIA_HOSTS = new Set(['ia-pedia.ch', 'ia-pedia.org', 'wikiped-ia.ch', 'wikiped-ia.org']);
const AI_PEDIA_HOSTS = new Set(['ai-pedia.ch']);

function normalizeHostname (hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, '');
}

export function resolveBrandingFromHostname (hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  const brandName = IA_PEDIA_HOSTS.has(normalizedHostname)
    ? 'ia-pedia'
    : AI_PEDIA_HOSTS.has(normalizedHostname)
      ? 'ai-pedia'
      : 'ki-pedia';
  const logoPrefix = brandName.slice(0, 2);

  return {
    brandName,
    logoPrefix,
    pageTitle: `${brandName}.`,
    headerLogo: brandName,
    heroLogo: brandName,
  };
}

export function resolveCurrentBranding () {
  return resolveBrandingFromHostname(window.location.hostname);
}
