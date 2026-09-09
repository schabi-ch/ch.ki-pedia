import { isbot } from 'isbot';
import type { IncomingHttpHeaders } from 'http';

export interface RequestLike {
  headers: IncomingHttpHeaders;
}

// Every real browser sends a User-Agent header; a missing or empty one is
// almost always a script. Everything else is matched against the maintained
// crawler/bot pattern list of the `isbot` package (search engines, AI
// crawlers, headless browsers, HTTP client libraries such as curl, axios,
// python-requests, Go-http-client, ...).
export function isBotUserAgent(userAgent: string | undefined): boolean {
  const value = userAgent?.trim();
  if (!value) {
    return true;
  }
  return isbot(value);
}

export function getUserAgent(req: RequestLike): string | undefined {
  const header = req.headers['user-agent'];
  return typeof header === 'string' ? header : undefined;
}

export function isBotRequest(req: RequestLike): boolean {
  return isBotUserAgent(getUserAgent(req));
}
