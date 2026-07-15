import type { APIRoute } from 'astro';
import { siteOrigin } from '../lib/seo';

export const GET: APIRoute = () =>
  new globalThis.Response(
    `User-agent: *\nDisallow: /\nSitemap: ${siteOrigin}/sitemap-index.xml\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
