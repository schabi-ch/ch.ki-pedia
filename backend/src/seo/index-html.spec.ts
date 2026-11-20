/// <reference types="jest" />

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { NextFunction, Request, Response } from 'express';
import { createIndexHtmlMiddleware, renderIndexHtml } from './index-html';
import {
  AI_PEDIA_META,
  IA_PEDIA_META,
  KI_PEDIA_META,
  resolveSiteMeta,
} from './site-meta';

// Head of a production build (quasar build minifies and drops quotes).
const MINIFIED_TEMPLATE =
  '<!DOCTYPE html><html><head><title>ki-pedia.</title><meta charset=utf-8>' +
  '<meta name=description content="Fallback text."><meta property=og:type content=website>' +
  '<meta property=og:title content=ki-pedia.><meta property=og:description content="Fallback text.">' +
  '<meta property=og:image content=/og/ki-pedia.png><meta property=og:image:width content=1200>' +
  '<meta name=format-detection content="telephone=no"></head><body></body></html>';

describe('resolveSiteMeta', () => {
  it('maps the French domains to ia-pedia', () => {
    expect(resolveSiteMeta('ia-pedia.ch')).toBe(IA_PEDIA_META);
    expect(resolveSiteMeta('www.wikiped-ia.org')).toBe(IA_PEDIA_META);
  });

  it('maps ai-pedia.ch to the English texts', () => {
    expect(resolveSiteMeta('ai-pedia.ch')).toBe(AI_PEDIA_META);
  });

  it('falls back to ki-pedia for all other hosts', () => {
    expect(resolveSiteMeta('ki-pedia.org')).toBe(KI_PEDIA_META);
    expect(resolveSiteMeta('localhost:3000')).toBe(KI_PEDIA_META);
  });
});

describe('renderIndexHtml', () => {
  it('replaces title, description and og tags of a minified build', () => {
    const html = renderIndexHtml(
      MINIFIED_TEMPLATE,
      IA_PEDIA_META,
      'https://wikiped-ia.ch',
    );

    expect(html).toContain('<title>ia-pedia.</title>');
    expect(html).toContain(
      `<meta name="description" content="${IA_PEDIA_META.description}">`,
    );
    expect(html).toContain('<meta property="og:title" content="ia-pedia.">');
    expect(html).toContain(
      `<meta property="og:description" content="${IA_PEDIA_META.description}">`,
    );
    expect(html).toContain(
      '<meta property="og:image" content="https://wikiped-ia.ch/og/ia-pedia.png">',
    );
    expect(html).toContain('<meta property=og:image:width content=1200>');
    expect(html).toContain('<meta property=og:type content=website>');
    expect(html).toContain('<meta name=format-detection');
    expect(html).not.toContain('Fallback text.');
  });

  it('also handles the quoted tags of the unminified template', () => {
    const template =
      '<title>x</title>\n<meta name="description" content="old">\n' +
      '<meta property="og:title" content="old">\n<meta property="og:description" content="old">\n' +
      '<meta property="og:image" content="old">';

    expect(
      renderIndexHtml(template, AI_PEDIA_META, 'https://ai-pedia.ch'),
    ).not.toContain('old');
  });

  it('escapes HTML in the texts', () => {
    const html = renderIndexHtml(
      MINIFIED_TEMPLATE,
      { title: 'a<b', description: 'say "hi" & $1', image: '/x.png' },
      'https://ki-pedia.ch',
    );

    expect(html).toContain('<title>a&lt;b</title>');
    expect(html).toContain('content="say &quot;hi&quot; &amp; $1"');
  });
});

describe('createIndexHtmlMiddleware', () => {
  let rootPath: string;

  beforeAll(() => {
    rootPath = mkdtempSync(join(tmpdir(), 'index-html-'));
    writeFileSync(join(rootPath, 'index.html'), MINIFIED_TEMPLATE);
    mkdirSync(join(rootPath, 'assets'));
    writeFileSync(join(rootPath, 'assets', 'app.js'), '');
  });

  afterAll(() => {
    rmSync(rootPath, { recursive: true, force: true });
  });

  function run(path: string, method = 'GET') {
    const req = {
      method,
      path,
      headers: { host: 'ai-pedia.ch' },
    } as unknown as Request;
    const res = {
      set: jest.fn(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const next = jest.fn() as NextFunction;
    createIndexHtmlMiddleware(rootPath)(req, res as unknown as Response, next);
    return { res, next };
  }

  it.each(['/', '/about', '/article/de/St._Gallen', '/index.html'])(
    'serves the localized index.html for the page %s',
    (path) => {
      const { res, next } = run(path);

      expect(next).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('<title>ai-pedia.</title>'),
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining(
          'content="https://ai-pedia.ch/og/ai-pedia.png"',
        ),
      );
    },
  );

  it.each([
    '/assets/app.js',
    '/api/health',
    '/api',
    '/robots.txt',
    '/sitemap.xml',
  ])('leaves %s to the next handler', (path) => {
    const { res, next } = run(path);

    expect(next).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('leaves non-GET requests alone', () => {
    const { next } = run('/', 'POST');

    expect(next).toHaveBeenCalled();
  });
});
