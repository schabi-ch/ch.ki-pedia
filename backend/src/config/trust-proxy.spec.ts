/// <reference types="jest" />

import { parseTrustProxy } from './trust-proxy';

describe('parseTrustProxy', () => {
  it('defaults to not trusting any proxy', () => {
    expect(parseTrustProxy(undefined)).toBe(false);
    expect(parseTrustProxy('')).toBe(false);
    expect(parseTrustProxy('false')).toBe(false);
  });

  it('parses booleans, hop counts and subnet lists', () => {
    expect(parseTrustProxy('true')).toBe(true);
    expect(parseTrustProxy(' 1 ')).toBe(1);
    expect(parseTrustProxy('loopback')).toBe('loopback');
    expect(parseTrustProxy('10.0.0.0/8, 127.0.0.1')).toBe(
      '10.0.0.0/8, 127.0.0.1',
    );
  });
});
