import type { APIRoute } from 'astro';
import { canonicalUrl, siteOrigin } from '../lib/seo';

export const GET: APIRoute = () =>
  new globalThis.Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><id>${siteOrigin}/</id><title>KBBQGuide</title><subtitle>Editorial preview. No recipe or guide is approved for syndication, so this feed intentionally contains no entries.</subtitle><link href="${canonicalUrl('/feed.xml/').replace('/feed.xml/', '/feed.xml')}" rel="self"/><link href="${siteOrigin}/"/></feed>\n`,
    { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } },
  );
