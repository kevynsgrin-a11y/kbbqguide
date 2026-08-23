import { getImage } from 'astro:assets';
import { approvedRecipeStructuredDataMedia } from './media';
import {
  recipeSocialCardEligible,
  recipeSocialImageHeight,
  recipeSocialImageWidth,
} from './recipe-social-gate';

export {
  recipeSocialCardEligible,
  recipeSocialImageHeight,
  recipeSocialImageWidth,
  type RecipeSocialMediaCandidate,
} from './recipe-social-gate';

export interface RecipeSocialCard {
  readonly image: string;
  readonly alt: string;
  readonly width: typeof recipeSocialImageWidth;
  readonly height: typeof recipeSocialImageHeight;
}

/**
 * Builds a first-party, standards-sized JPEG card only for an indexable,
 * publishable recipe with explicitly assigned, reviewed, social-licensed
 * finished-dish media. All other cases deliberately return null.
 */
export async function resolveRecipeSocialCard(
  recipeId: string,
  imageManifestIds: readonly string[],
  isPubliclyPublishable: boolean,
): Promise<RecipeSocialCard | null> {
  if (!isPubliclyPublishable) return null;

  const media = approvedRecipeStructuredDataMedia(
    recipeId,
    imageManifestIds,
  ).find((candidate) => recipeSocialCardEligible(true, candidate));
  if (!media) return null;

  const image = await getImage({
    src: media.image,
    width: recipeSocialImageWidth,
    height: recipeSocialImageHeight,
    fit: 'cover',
    position: media.focalPoint,
    format: 'jpg',
    quality: 80,
  });

  return {
    image: image.src,
    alt: `${media.provenance.disclosure} ${media.altText}`.trim(),
    width: recipeSocialImageWidth,
    height: recipeSocialImageHeight,
  };
}
