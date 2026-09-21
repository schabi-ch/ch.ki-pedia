import type { IncomingHttpHeaders } from 'http';

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',')[0]?.trim();
}

function hostOfUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

// The SPA posts page views from the same origin it was served from, so a
// browser sends Sec-Fetch-Site: same-origin and an Origin matching the Host.
// Requests that carry contradicting headers were not made by the app. Missing
// headers are tolerated (older browsers, proxies stripping them).
export function isSameOriginRequest(req: {
  headers: IncomingHttpHeaders;
}): boolean {
  const fetchSite = firstHeaderValue(req.headers['sec-fetch-site']);
  if (fetchSite && fetchSite.toLowerCase() !== 'same-origin') {
    return false;
  }

  const host = (
    firstHeaderValue(req.headers['x-forwarded-host']) ??
    firstHeaderValue(req.headers.host) ??
    ''
  ).toLowerCase();
  if (!host) {
    return true;
  }

  const originHost = hostOfUrl(firstHeaderValue(req.headers.origin));
  if (originHost) {
    return originHost === host;
  }
  const refererHost = hostOfUrl(firstHeaderValue(req.headers.referer));
  if (refererHost) {
    return refererHost === host;
  }
  return true;
}
