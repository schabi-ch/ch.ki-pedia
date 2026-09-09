import type { IncomingHttpHeaders } from 'http';

// Used when the request carries no usable Host header at all.
export const DEFAULT_PUBLIC_HOST = 'ki-pedia.ch';

const HOST_PATTERN = /^[a-z0-9.-]+(?::\d{1,5})?$/;

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',')[0]?.trim();
}

function isLocalHost(host: string): boolean {
  const name = host.replace(/:\d+$/, '');
  return name === 'localhost' || name === '127.0.0.1' || name === '[::1]';
}

// The app is served unchanged under several domains (ki-pedia.ch/.org,
// wikiped-ia.ch/.org, ...). robots.txt and the sitemap must reference the
// domain they were requested on, so the origin is derived per request. A
// reverse proxy in front of the backend is honoured via X-Forwarded-*.
export function resolvePublicOrigin(headers: IncomingHttpHeaders): string {
  const forwardedHost = firstHeaderValue(headers['x-forwarded-host']);
  const hostHeader = firstHeaderValue(headers.host);
  const candidate = (forwardedHost || hostHeader || '').toLowerCase();
  const host = HOST_PATTERN.test(candidate) ? candidate : DEFAULT_PUBLIC_HOST;

  const forwardedProto = firstHeaderValue(
    headers['x-forwarded-proto'],
  )?.toLowerCase();
  const protocol =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : isLocalHost(host)
        ? 'http'
        : 'https';

  return `${protocol}://${host}`;
}
