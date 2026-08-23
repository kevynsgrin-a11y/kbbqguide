import { approvedRecipeStructuredDataMedia } from './media';

const squareImage = { width: 1200, height: 1200 } as const;
const fourByThreeImage = { width: 1200, height: 900 } as const;
const sixteenByNineImage = { width: 1200, height: 675 } as const;
const firstPartyOrigin = 'https://kbbqguide.com';

/** Google Recipe image aspect-ratio set, rendered as first-party JPEGs. */
export const recipeStructuredDataImageVariants = [
  squareImage,
  fourByThreeImage,
  sixteenByNineImage,
] as const;

export interface ApprovedRecipeStructuredDataImageSet {
  readonly urls: readonly [string, string, string];
}

const approvedImageSets = new WeakMap<object, string>();

function firstPartyAbsoluteImageUrl(imagePath: string): string | null {
  try {
    const site = new globalThis.URL(firstPartyOrigin);
    if (
      site.protocol !== 'https:' ||
      site.username !== '' ||
      site.password !== ''
    )
      return null;

    const image = new globalThis.URL(imagePath, site);
    if (
      image.protocol !== 'https:' ||
      image.origin !== site.origin ||
      image.username !== '' ||
      image.password !== ''
    )
      return null;

    return image.href;
  } catch {
    return null;
  }
}

/**
 * Checks that a JSON-LD image collection originated in this module for this
 * exact recipe. Raw URL arrays and cross-recipe evidence cannot satisfy it.
 */
export function isApprovedRecipeStructuredDataImageSet(
  value: unknown,
  recipeId: string,
): value is ApprovedRecipeStructuredDataImageSet {
  if (value === null || typeof value !== 'object') return false;

  const urls = (value as { urls?: unknown }).urls;
  return (
    approvedImageSets.get(value) === recipeId &&
    Array.isArray(urls) &&
    urls.length === recipeStructuredDataImageVariants.length &&
    urls.every(
      (url) =>
        typeof url === 'string' && firstPartyAbsoluteImageUrl(url) !== null,
    )
  );
}

/**
 * Builds three first-party image derivatives only after the shared media gate
 * confirms a real, assigned, rights-cleared, human-approved finished-dish
 * asset. A failed transform returns null rather than a partial or master-image
 * schema claim.
 */
export async function approvedRecipeStructuredDataImageSet(
  recipeId: string,
  imageManifestIds: readonly string[],
): Promise<ApprovedRecipeStructuredDataImageSet | null> {
  const media = approvedRecipeStructuredDataMedia(
    recipeId,
    imageManifestIds,
  )[0];
  if (!media) return null;

  try {
    const { getImage } = await import('astro:assets');
    const derivatives = await Promise.all(
      recipeStructuredDataImageVariants.map(async ({ width, height }) => {
        const image = await getImage({
          src: media.image,
          width,
          height,
          fit: 'cover',
          position: media.focalPoint,
          format: 'jpg',
          quality: 85,
        });
        return firstPartyAbsoluteImageUrl(image.src);
      }),
    );

    const [square, fourByThree, sixteenByNine] = derivatives;
    if (!square || !fourByThree || !sixteenByNine) return null;

    const urls = [square, fourByThree, sixteenByNine] as [
      string,
      string,
      string,
    ];
    Object.freeze(urls);
    const imageSet: ApprovedRecipeStructuredDataImageSet = Object.freeze({
      urls,
    });
    approvedImageSets.set(imageSet, recipeId);
    return imageSet;
  } catch {
    return null;
  }
}
