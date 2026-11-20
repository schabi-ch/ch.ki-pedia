import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve, sep } from 'path';
import type { NextFunction, Request, Response } from 'express';
import { resolvePublicHost, resolvePublicOrigin } from './public-origin';
import { SEO_ROOT_ROUTES } from './seo.controller';
import { resolveSiteMeta, type SiteMeta } from './site-meta';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// The production build is minified, which drops attribute quotes where it
// can (<meta name=description content="...">), so quotes are optional here.
function replaceMetaTag(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
): string {
  const pattern = new RegExp(
    `<meta\\s+${attribute}=["']?${key}["']?\\s[^>]*>`,
    'i',
  );
  return html.replace(
    pattern,
    () => `<meta ${attribute}="${key}" content="${escapeHtml(content)}">`,
  );
}

// og:image must be an absolute URL, hence the origin of the request.
export function renderIndexHtml(
  template: string,
  meta: SiteMeta,
  origin: string,
): string {
  let html = template.replace(
    /<title>[^<]*<\/title>/i,
    () => `<title>${escapeHtml(meta.title)}</title>`,
  );
  html = replaceMetaTag(html, 'name', 'description', meta.description);
  html = replaceMetaTag(html, 'property', 'og:title', meta.title);
  html = replaceMetaTag(html, 'property', 'og:description', meta.description);
  html = replaceMetaTag(html, 'property', 'og:image', origin + meta.image);
  return html;
}

function isExistingFile(rootPath: string, urlPath: string): boolean {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return false;
  }
  const filePath = resolve(rootPath, `.${decoded}`);
  if (!filePath.startsWith(rootPath + sep)) return false;
  return existsSync(filePath) && statSync(filePath).isFile();
}

// Serves the SPA's index.html with title, description and og:* in the
// language of the requested domain. Link previews (WhatsApp, LinkedIn, ...)
// and many crawlers do not run JavaScript, so this has to happen on the
// server. Static files and the API are left to the next handlers.
export function createIndexHtmlMiddleware(frontendRootPath: string) {
  const rootPath = resolve(frontendRootPath);
  const indexFilePath = join(rootPath, 'index.html');
  let template: string | undefined;

  return (req: Request, res: Response, next: NextFunction): void => {
    const isPageRequest =
      (req.method === 'GET' || req.method === 'HEAD') &&
      req.path !== '/api' &&
      !req.path.startsWith('/api/') &&
      !SEO_ROOT_ROUTES.includes(req.path.slice(1)) &&
      (req.path === '/index.html' || !isExistingFile(rootPath, req.path));
    if (!isPageRequest) {
      next();
      return;
    }

    if (template === undefined) {
      if (!existsSync(indexFilePath)) {
        next();
        return;
      }
      template = readFileSync(indexFilePath, 'utf8');
    }

    const meta = resolveSiteMeta(resolvePublicHost(req.headers));
    const origin = resolvePublicOrigin(req.headers);
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(renderIndexHtml(template, meta, origin));
  };
}
