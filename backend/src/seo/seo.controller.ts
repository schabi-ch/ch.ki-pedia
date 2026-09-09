import { Controller, Get, Header, Req } from '@nestjs/common';
import type { Request } from 'express';
import { resolvePublicOrigin } from './public-origin';

// Public information pages that search engines may index. Everything else
// (article views, the API, the statistics page) is kept out of the index:
// article pages are a Wikipedia mirror and every render costs API calls.
export const SITEMAP_PATHS = [
  '/about',
  '/education',
  '/imprint',
  '/privacy',
] as const;

export const ROBOTS_DISALLOW_PATHS = [
  '/api/',
  '/article/',
  '/statistics',
] as const;

// Crawlers that collect training data for AI models (or fetch pages on
// behalf of AI assistants) are kept off the whole site. Search engines stay
// welcome on the sitemap pages. Google-Extended and Applebot-Extended are
// robots.txt tokens that only control AI training use of the regular
// Googlebot/Applebot crawl.
export const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'PerplexityBot',
  'Perplexity-User',
  'Meta-ExternalAgent',
  'FacebookBot',
  'cohere-ai',
  'Diffbot',
  'omgili',
  'Timpibot',
  'YouBot',
  'ImagesiftBot',
] as const;

const CACHE_CONTROL = 'public, max-age=3600';

// Served without the /api prefix, see setGlobalPrefix() in main.ts.
@Controller()
export class SeoController {
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', CACHE_CONTROL)
  robots(@Req() req: Request): string {
    const origin = resolvePublicOrigin(req.headers);
    return [
      ...AI_CRAWLER_USER_AGENTS.map((agent) => `User-agent: ${agent}`),
      'Disallow: /',
      '',
      'User-agent: *',
      ...ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
      '',
      `Sitemap: ${origin}/sitemap.xml`,
      '',
    ].join('\n');
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', CACHE_CONTROL)
  sitemap(@Req() req: Request): string {
    const origin = resolvePublicOrigin(req.headers);
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...SITEMAP_PATHS.map(
        (path) => `  <url>\n    <loc>${origin}${path}</loc>\n  </url>`,
      ),
      '</urlset>',
      '',
    ].join('\n');
  }
}
