import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import registryData from '../../data/url-registry.json';
import {
  isRecipePublishable,
  recipeSitemapLastModified,
} from '../lib/publication-governance';
import { releaseState } from '../lib/release-state';
import { canonicalUrl } from '../lib/seo';
import type { UrlRegistry } from '../lib/url-registry';
import type { CompleteRecipe } from '../schemas/recipe';

const registry = registryData as UrlRegistry;

/**
 * This endpoint is empty while the preview has no indexed recipe records. It
 * deliberately derives future entries from the shared human-review predicate,
 * so a complete draft cannot enter a public sitemap merely because it exists.
 */
export const GET: APIRoute = async () => {
  if (!releaseState.exposesXmlSitemap) {
    return new globalThis.Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n',
      {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      },
    );
  }

  const publishedRecipeLastModified = new Map(
    (await getCollection('recipes'))
      .map((entry) => entry.data)
      .filter(
        (recipe): recipe is CompleteRecipe =>
          recipe.contentStatus === 'complete' && isRecipePublishable(recipe),
      )
      .flatMap((recipe) => {
        const lastModified = recipeSitemapLastModified(recipe);
        return lastModified === null
          ? []
          : [[recipe.id, lastModified] as const];
      }),
  );
  const urls = registry.entries
    .filter(
      (entry) =>
        entry.type === 'recipe' && publishedRecipeLastModified.has(entry.id),
    )
    .map((entry) => {
      const lastModified = publishedRecipeLastModified.get(entry.id);
      if (lastModified === undefined) return '';
      return `<url><loc>${canonicalUrl(entry.path)}</loc><lastmod>${lastModified}</lastmod></url>`;
    })
    .join('');

  return new globalThis.Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`,
    {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    },
  );
};
