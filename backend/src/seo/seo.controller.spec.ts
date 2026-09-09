/// <reference types="jest" />

import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';
import { DEFAULT_PUBLIC_HOST, resolvePublicOrigin } from './public-origin';
import { AI_CRAWLER_USER_AGENTS, SeoController } from './seo.controller';

function request(headers: IncomingHttpHeaders): Request {
  return { headers } as Request;
}

describe('resolvePublicOrigin', () => {
  it('uses https and the Host header by default', () => {
    expect(resolvePublicOrigin({ host: 'www.wikiped-ia.org' })).toBe(
      'https://www.wikiped-ia.org',
    );
  });

  it('prefers X-Forwarded-Host and X-Forwarded-Proto from a reverse proxy', () => {
    expect(
      resolvePublicOrigin({
        host: '127.0.0.1:3000',
        'x-forwarded-host': 'ki-pedia.org, internal',
        'x-forwarded-proto': 'https',
      }),
    ).toBe('https://ki-pedia.org');
  });

  it('uses http for local development hosts', () => {
    expect(resolvePublicOrigin({ host: 'localhost:9000' })).toBe(
      'http://localhost:9000',
    );
  });

  it('falls back to the default host for missing or malformed headers', () => {
    expect(resolvePublicOrigin({})).toBe(`https://${DEFAULT_PUBLIC_HOST}`);
    expect(resolvePublicOrigin({ host: 'evil.example/<script>' })).toBe(
      `https://${DEFAULT_PUBLIC_HOST}`,
    );
  });
});

describe('SeoController', () => {
  const controller = new SeoController();

  it('serves a robots.txt that keeps crawlers off the API, articles and statistics', () => {
    const body = controller.robots(request({ host: 'ki-pedia.ch' }));

    expect(body).toBe(
      [
        ...AI_CRAWLER_USER_AGENTS.map((agent) => `User-agent: ${agent}`),
        'Disallow: /',
        '',
        'User-agent: *',
        'Disallow: /api/',
        'Disallow: /article/',
        'Disallow: /statistics',
        '',
        'Sitemap: https://ki-pedia.ch/sitemap.xml',
        '',
      ].join('\n'),
    );
  });

  it('blocks known AI training crawlers from the whole site', () => {
    const body = controller.robots(request({ host: 'ki-pedia.ch' }));
    const groups = body.split('\n\n');

    expect(groups[0]).toContain('User-agent: GPTBot');
    expect(groups[0]).toContain('User-agent: ClaudeBot');
    expect(groups[0]).toContain('User-agent: Google-Extended');
    expect(groups[0].trim().endsWith('Disallow: /')).toBe(true);
    // The general section must not be affected by the blanket block.
    expect(groups[1]).not.toContain('Disallow: /\n');
    expect(groups[1]).toContain('Disallow: /api/');
  });

  it('serves a sitemap with the four information pages on the requested host', () => {
    const body = controller.sitemap(request({ host: 'wikiped-ia.ch' }));

    expect(body).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(body.match(/<url>/g)).toHaveLength(4);
    for (const path of ['/about', '/education', '/imprint', '/privacy']) {
      expect(body).toContain(`<loc>https://wikiped-ia.ch${path}</loc>`);
    }
    expect(body).not.toContain('/article');
  });
});
