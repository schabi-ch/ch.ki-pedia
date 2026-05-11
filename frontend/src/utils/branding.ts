const KI_PEDIA_HOSTS = new Set(['ki-pedia.ch', 'ki-pedia.org']);

function normalizeHostname (hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, '');
}

export function isKiPediaHostname (hostname: string): boolean {
  return KI_PEDIA_HOSTS.has(normalizeHostname(hostname));
}

export function resolveBrandingFromHostname (hostname: string) {
  const isKiPediaBrand = isKiPediaHostname(hostname);

  return {
    isKiPediaBrand,
    pageTitle: isKiPediaBrand ? 'ki-pedia' : 'wikiped-IA',
    headerLogo: isKiPediaBrand ? 'ki-pedia' : 'wikiped-IA',
    heroLogo: isKiPediaBrand ? 'ki-pedia' : 'wikiped-IA',
  };
}

export function resolveCurrentBranding () {
  return resolveBrandingFromHostname(window.location.hostname);
}
