import type { APIRoute } from 'astro';
import { releaseState } from '../lib/release-state';
import { siteOrigin } from '../lib/seo';

export const GET: APIRoute = () =>
  new globalThis.Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${releaseState.exposesXmlSitemap ? `<sitemap><loc>${siteOrigin}/sitemap.xml</loc></sitemap>` : ''}</sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
