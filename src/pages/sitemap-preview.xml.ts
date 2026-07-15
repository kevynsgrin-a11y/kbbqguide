import type { APIRoute } from 'astro';
import registryData from '../../data/url-registry.json';
import { canonicalUrl } from '../lib/seo';
import type { UrlRegistry } from '../lib/url-registry';

const registry = registryData as UrlRegistry;
const renderedIds = new Set([
  'SYS_HOME',
  'SYS_START',
  'SYS_RECIPES',
  'CAT_MEAT',
  'CAT_SEAFOOD',
  'CAT_BANCHAN',
  'CAT_FRESH',
  'CAT_SAUCES',
  'CAT_DESSERTS',
  'SYS_GUIDES',
  ...Array.from(
    { length: 12 },
    (_, index) => `G${String(index + 1).padStart(2, '0')}`,
  ),
  'SYS_MENUS',
  'MENU_2',
  'MENU_4',
  'MENU_8',
  'SYS_TOOLS',
  'SYS_SITEMAP',
  'SYS_SHOP',
  'SYS_NEWSLETTER',
  'POL_AFFILIATE',
  'POL_SPONSORED',
  'SYS_CLASS',
  'SYS_MEDIA_KIT',
  'SYS_LICENSING',
  'SYS_PARTNERSHIPS',
  ...registry.entries
    .filter((entry) => entry.type === 'recipe')
    .map((entry) => entry.id),
]);

export const GET: APIRoute = () => {
  const urls = registry.entries
    .filter((entry) => renderedIds.has(entry.id))
    .map((entry) => `<url><loc>${canonicalUrl(entry.path)}</loc></url>`)
    .join('');
  return new globalThis.Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
