import type { ResolvedMedia } from './media';

export const recipeSocialImageWidth = 1200;
export const recipeSocialImageHeight = 630;

export type RecipeSocialMediaCandidate = Pick<ResolvedMedia, 'rights'>;

/**
 * A social URL is a public distribution of the image, not merely page use.
 * The candidate media has already passed the stricter recipe image evidence
 * gate in `approvedRecipeStructuredDataMedia` before this is evaluated.
 */
export function recipeSocialCardEligible(
  isPubliclyPublishable: boolean,
  media: RecipeSocialMediaCandidate | null,
): boolean {
  return (
    isPubliclyPublishable &&
    media !== null &&
    /\bsocial\s+preview\b/i.test(media.rights.scope)
  );
}
