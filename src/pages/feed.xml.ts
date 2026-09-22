import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { canonicalUrl, siteOrigin } from '../lib/seo';
import {
  isRecipePublishable,
  recipeSitemapLastModified,
} from '../lib/publication-governance';
import { releaseState } from '../lib/release-state';
import type { CompleteRecipe } from '../schemas/recipe';

export const GET: APIRoute = async () => {
  const feedEntries =
    releaseState.mode === 'public-launch'
      ? (await getCollection('recipes'))
          .map((entry) => entry.data)
          .filter(
            (recipe): recipe is CompleteRecipe =>
              recipe.contentStatus === 'complete' &&
              isRecipePublishable(recipe),
          )
          .flatMap((recipe) => {
            const updated = recipeSitemapLastModified(recipe);
            const path = `/recipes/${recipe.category}/${recipe.canonicalSlug}/`;
            return updated
              ? [[recipe.title, path, updated] as const]
              : [];
          })
          .map(
            ([title, path, updated]) =>
              `<entry><title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title><link href="${canonicalUrl(path)}"/><updated>${updated}</updated><id>${canonicalUrl(path)}</id></entry>`,
          )
          .join('')
      : '';

  const subtitle =
    releaseState.mode === 'public-launch'
      ? 'Korean BBQ at home, made clear.'
      : 'Editorial preview. No recipe or guide is approved for syndication, so this feed intentionally contains no entries.';

  return new globalThis.Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><id>${siteOrigin}/</id><title>KBBQGuide</title><subtitle>${subtitle}</subtitle><link href="${canonicalUrl('/feed.xml/').replace('/feed.xml/', '/feed.xml')}" rel="self"/><link href="${siteOrigin}/"/>${feedEntries}</feed>
`,
    { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } },
  );
};
