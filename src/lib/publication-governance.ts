import type { CompleteRecipe } from '../schemas/recipe';

/**
 * These are intentionally publication states, not claims about recipe quality.
 * A recipe is public only after it has the complete, attributable evidence that
 * the schema requires for the `published` state.
 */
export const publicationStatuses = ['draft', 'reviewed', 'published'] as const;

export type PublicationStatus = (typeof publicationStatuses)[number];

export const humanReviewGateKeys = [
  'testCook',
  'foodSafety',
  'koreanLanguage',
  'editorial',
] as const;

export type HumanReviewGateKey = (typeof humanReviewGateKeys)[number];

const humanReviewGateLabels: Record<HumanReviewGateKey, string> = {
  testCook: 'test-cook review',
  foodSafety: 'food-safety review',
  koreanLanguage: 'Korean-language review',
  editorial: 'editorial review',
};

const placeholderPattern =
  /\{\{[^}]+\}\}|^\s*(?:tbd|todo|unknown|n\/a|none|legal[ _-]?name)\s*$/i;
const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Reject placeholders and empty values before they can be surfaced publicly. */
export function isActualPublicationText(value: unknown): value is string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length >= 2 && !placeholderPattern.test(normalized);
}

/** A public accountability link must be a real HTTPS URL, never a placeholder. */
export function isActualProfileUrl(value: unknown): value is string {
  if (!isActualPublicationText(value)) return false;

  try {
    const url = new globalThis.URL(value);
    return (
      url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.hostname !== 'example.com' &&
      !placeholderPattern.test(url.hostname)
    );
  } catch {
    return false;
  }
}

/** Accept only a real calendar day expressed as an ISO-8601 date. */
export function isActualPublicationDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = isoDatePattern.exec(value);
  if (!match) return false;

  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function hasCompleteHumanGateEvidence(
  gate: unknown,
  requiresCredential = false,
): boolean {
  if (!isRecord(gate)) return false;

  return (
    gate.status === 'approved' &&
    isActualPublicationText(gate.reviewerName) &&
    isActualProfileUrl(gate.reviewerProfileUrl) &&
    isActualPublicationText(gate.reviewerRole) &&
    (!requiresCredential || isActualPublicationText(gate.reviewerCredential)) &&
    isActualPublicationDate(gate.reviewedAt) &&
    isActualPublicationText(gate.evidence)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function reviewGatesFrom(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value) || !isRecord(value.reviewGates)) return null;
  return value.reviewGates;
}

/**
 * Human-readable labels for the gates whose accountable evidence is still
 * incomplete. This lets a draft notice describe partial review truthfully.
 */
export function incompleteHumanReviewGateLabels(
  recipe: unknown,
): readonly string[] {
  const reviewGates = reviewGatesFrom(recipe);
  return humanReviewGateKeys
    .filter(
      (key) =>
        !hasCompleteHumanGateEvidence(reviewGates?.[key], key === 'foodSafety'),
    )
    .map((key) => humanReviewGateLabels[key]);
}

export function publicationStatusLabel(status: PublicationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export interface RecipePublishability {
  readonly isPublishable: boolean;
  readonly blockers: readonly string[];
}

/**
 * The sole public-release predicate for recipes. It is deliberately stricter
 * than `contentStatus === 'complete'`: a complete draft is still not a public
 * food-safety or editorial claim.
 */
export function recipePublishability(recipe: unknown): RecipePublishability {
  const blockers: string[] = [];

  if (!isRecord(recipe))
    return {
      isPublishable: false,
      blockers: ['recipe record is missing or malformed'],
    };

  if (recipe.contentStatus !== 'complete')
    blockers.push('recipe content is not complete');
  if (recipe.editorialStatus !== 'published')
    blockers.push('publication status is not published');
  if (!isActualPublicationText(recipe.author))
    blockers.push('named author is missing or unresolved');
  if (!isActualProfileUrl(recipe.authorProfileUrl))
    blockers.push('author profile URL is missing or unresolved');
  if (!isActualPublicationDate(recipe.materiallyUpdatedAt))
    blockers.push('materially updated date is missing');
  if (!isActualPublicationDate(recipe.publishedAt))
    blockers.push('publication date is missing');

  const reviewGates = reviewGatesFrom(recipe);
  if (reviewGates === null)
    blockers.push('human-review gate record is missing or malformed');
  for (const key of humanReviewGateKeys) {
    if (!hasCompleteHumanGateEvidence(reviewGates?.[key], key === 'foodSafety'))
      blockers.push(`${key} human-review evidence is incomplete`);
  }

  return { isPublishable: blockers.length === 0, blockers };
}

export function isRecipePublishable(recipe: unknown): boolean {
  return recipePublishability(recipe).isPublishable;
}

/**
 * Returns the only meaningful sitemap date for a recipe: the later of the
 * genuine publication date and the most recent material update. It deliberately
 * returns null for every draft, incomplete record, malformed date, or
 * non-public recipe so callers cannot emit synthetic `<lastmod>` values.
 */
export function recipeSitemapLastModified(
  recipe: CompleteRecipe,
): string | null {
  if (!isRecipePublishable(recipe)) return null;
  if (
    !isActualPublicationDate(recipe.publishedAt) ||
    !isActualPublicationDate(recipe.materiallyUpdatedAt)
  )
    return null;

  return recipe.materiallyUpdatedAt > recipe.publishedAt
    ? recipe.materiallyUpdatedAt
    : recipe.publishedAt;
}

function requirePublicationText(
  value: string | null | undefined,
  field: string,
): string {
  if (!isActualPublicationText(value))
    throw new Error(`Publishable recipe has an invalid ${field}.`);
  return value;
}

function requireProfileUrl(
  value: string | null | undefined,
  field: string,
): string {
  if (!isActualProfileUrl(value))
    throw new Error(`Publishable recipe has an invalid ${field}.`);
  return value;
}

function requirePublicationDate(value: string | null, field: string): string {
  if (!isActualPublicationDate(value))
    throw new Error(`Publishable recipe has no valid ${field}.`);
  return value;
}

export interface RecipeAccountability {
  readonly author: { readonly name: string; readonly profileUrl: string };
  readonly testCook: { readonly name: string; readonly profileUrl: string };
  readonly foodSafetyReviewer: {
    readonly name: string;
    readonly profileUrl: string;
    readonly credential: string;
  };
  readonly koreanLanguageReviewer: {
    readonly name: string;
    readonly profileUrl: string;
  };
  readonly editorialReviewer: {
    readonly name: string;
    readonly profileUrl: string;
  };
  readonly materiallyUpdatedAt: string;
  readonly publishedAt: string;
}

/**
 * Returns only fully substantiated information suitable for the public page.
 * Draft and partially reviewed records intentionally render no accountability
 * line, rather than exposing placeholders or implying completed review.
 */
export function recipeAccountability(
  recipe: CompleteRecipe,
): RecipeAccountability | null {
  if (!isRecipePublishable(recipe)) return null;

  return {
    author: {
      name: requirePublicationText(recipe.author, 'author'),
      profileUrl: requireProfileUrl(recipe.authorProfileUrl, 'author profile'),
    },
    testCook: {
      name: requirePublicationText(
        recipe.reviewGates.testCook.reviewerName,
        'test-cook reviewer',
      ),
      profileUrl: requireProfileUrl(
        recipe.reviewGates.testCook.reviewerProfileUrl,
        'test-cook profile',
      ),
    },
    foodSafetyReviewer: {
      name: requirePublicationText(
        recipe.reviewGates.foodSafety.reviewerName,
        'food-safety reviewer',
      ),
      profileUrl: requireProfileUrl(
        recipe.reviewGates.foodSafety.reviewerProfileUrl,
        'food-safety profile',
      ),
      credential: requirePublicationText(
        recipe.reviewGates.foodSafety.reviewerCredential,
        'food-safety credential',
      ),
    },
    koreanLanguageReviewer: {
      name: requirePublicationText(
        recipe.reviewGates.koreanLanguage.reviewerName,
        'Korean-language reviewer',
      ),
      profileUrl: requireProfileUrl(
        recipe.reviewGates.koreanLanguage.reviewerProfileUrl,
        'Korean-language profile',
      ),
    },
    editorialReviewer: {
      name: requirePublicationText(
        recipe.reviewGates.editorial.reviewerName,
        'editorial reviewer',
      ),
      profileUrl: requireProfileUrl(
        recipe.reviewGates.editorial.reviewerProfileUrl,
        'editorial profile',
      ),
    },
    materiallyUpdatedAt: requirePublicationDate(
      recipe.materiallyUpdatedAt,
      'materially updated date',
    ),
    publishedAt: requirePublicationDate(recipe.publishedAt, 'publication date'),
  };
}
