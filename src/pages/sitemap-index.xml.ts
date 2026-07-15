import type { APIRoute } from 'astro';
import { canonicalUrl } from '../lib/seo';

export const GET: APIRoute = () =>
  new globalThis.Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${canonicalUrl('/sitemap-preview.xml/').replace('/sitemap-preview.xml/', '/sitemap-preview.xml')}</loc></sitemap></sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
