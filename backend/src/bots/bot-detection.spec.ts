/// <reference types="jest" />

import { isBotRequest, isBotUserAgent } from './bot-detection';

describe('bot detection', () => {
  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];

  const bots = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'GPTBot/1.0',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36',
    'curl/8.0',
    'python-requests/2.31',
    'axios/1.6.0',
    'Go-http-client/1.1',
  ];

  it.each(browsers)('accepts browser user agent %s', (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(false);
  });

  it.each(bots)('detects bot user agent %s', (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(true);
  });

  it('treats a missing or empty user agent as bot', () => {
    expect(isBotUserAgent(undefined)).toBe(true);
    expect(isBotUserAgent('')).toBe(true);
    expect(isBotUserAgent('   ')).toBe(true);
  });

  it('reads the user agent from the request headers', () => {
    expect(isBotRequest({ headers: { 'user-agent': browsers[0] } })).toBe(
      false,
    );
    expect(isBotRequest({ headers: { 'user-agent': bots[0] } })).toBe(true);
    expect(isBotRequest({ headers: {} })).toBe(true);
  });
});
