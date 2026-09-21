/// <reference types="jest" />

import { isSameOriginRequest } from './same-origin';

describe('isSameOriginRequest', () => {
  it('accepts requests from the SPA on the same host', () => {
    expect(
      isSameOriginRequest({
        headers: {
          host: 'ki-pedia.ch',
          origin: 'https://ki-pedia.ch',
          'sec-fetch-site': 'same-origin',
        },
      }),
    ).toBe(true);
  });

  it('compares against the forwarded host behind a proxy', () => {
    expect(
      isSameOriginRequest({
        headers: {
          host: '127.0.0.1:3000',
          'x-forwarded-host': 'www.wikiped-ia.org',
          origin: 'https://www.wikiped-ia.org',
        },
      }),
    ).toBe(true);
  });

  it('rejects cross-site fetches and foreign origins', () => {
    expect(
      isSameOriginRequest({
        headers: { host: 'ki-pedia.ch', 'sec-fetch-site': 'cross-site' },
      }),
    ).toBe(false);
    expect(
      isSameOriginRequest({
        headers: { host: 'ki-pedia.ch', origin: 'https://evil.example' },
      }),
    ).toBe(false);
    expect(
      isSameOriginRequest({
        headers: { host: 'ki-pedia.ch', referer: 'https://evil.example/x' },
      }),
    ).toBe(false);
  });

  it('tolerates missing or unparsable headers', () => {
    expect(isSameOriginRequest({ headers: { host: 'ki-pedia.ch' } })).toBe(
      true,
    );
    expect(
      isSameOriginRequest({ headers: { host: 'ki-pedia.ch', origin: 'null' } }),
    ).toBe(true);
    expect(isSameOriginRequest({ headers: {} })).toBe(true);
  });
});
