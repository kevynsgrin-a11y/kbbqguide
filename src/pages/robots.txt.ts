import type { APIRoute } from 'astro';
import { releaseState } from '../lib/release-state';
import { siteOrigin } from '../lib/seo';

export const GET: APIRoute = () =>
  new globalThis.Response(
    releaseState.robotsPolicy === 'allow-all'
      ? `User-agent: *\nAllow: /\n${releaseState.exposesXmlSitemap ? `Sitemap: ${siteOrigin}/sitemap.xml\n` : ''}`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
