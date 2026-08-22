import {
  isActualProfileUrl,
  isActualPublicationText,
  publicationStatuses,
  type PublicationStatus,
} from './publication-governance';
import type { ReleaseState } from './release-state';

/**
 * Guides, menus, and planning tools can carry safety or cultural guidance.
 * They therefore use the same named, evidenced human gates as recipes rather
 * than becoming public because a site-wide launch flag was set.
 */
export const nonRecipeReviewGateKeys = [
  'testCook',
  'foodSafety',
  'koreanLanguage',
  'editorial',
] as const;

export type NonRecipeReviewGateKey = (typeof nonRecipeReviewGateKeys)[number];

export interface NonRecipeReviewGate {
  readonly status: 'required' | 'approved';
  readonly reviewerName: string | null;
  readonly reviewerProfileUrl: string | null;
  readonly reviewerRole: string | null;
  readonly reviewerCredential: string | null;
  readonly reviewedAt: string | null;
  readonly evidence: string | null;
}

export interface NonRecipePublication {
  /** `reviewed` is still non-public; only `published` can qualify. */
  readonly editorialStatus: PublicationStatus;
  readonly author: string | null;
  readonly authorProfileUrl: string | null;
  readonly materiallyUpdatedAt: string | null;
  readonly publishedAt: string | null;
  readonly reviewGates: Readonly<
    Record<NonRecipeReviewGateKey, NonRecipeReviewGate>
  >;
}

function requiredGate(): NonRecipeReviewGate {
  return {
    status: 'required',
    reviewerName: null,
    reviewerProfileUrl: null,
    reviewerRole: null,
    reviewerCredential: null,
    reviewedAt: null,
    evidence: null,
  };
}

/**
 * Give draft records an explicit safe state. A fresh object is returned for
 * every record so later review data cannot accidentally mutate a sibling.
 */
export function createDraftNonRecipePublication(): NonRecipePublication {
  return {
    editorialStatus: publicationStatuses[0],
    author: null,
    authorProfileUrl: null,
    materiallyUpdatedAt: null,
    publishedAt: null,
    reviewGates: {
      testCook: requiredGate(),
      foodSafety: requiredGate(),
      koreanLanguage: requiredGate(),
      editorial: requiredGate(),
    },
  };
}

function isActualPublicationDate(
  value: string | null | undefined,
): value is string {
  if (!isActualPublicationText(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;

  const date = new globalThis.Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.valueOf()) &&
    date.toISOString().startsWith(`${value}T00:00:00.000Z`)
  );
}

export function hasCompleteNonRecipeGateEvidence(
  gate: NonRecipeReviewGate,
  requiresCredential = false,
): boolean {
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

export interface NonRecipePublicationEligibility {
  readonly isPublishable: boolean;
  readonly blockers: readonly string[];
}

/**
 * The sole release predicate for non-recipe editorial records. It fails
 * closed for absent names, profiles, dates, credentials, or review evidence.
 */
export function nonRecipePublicationEligibility(
  publication: NonRecipePublication,
): NonRecipePublicationEligibility {
  const blockers: string[] = [];

  if (publication.editorialStatus !== 'published')
    blockers.push('publication status is not published');
  if (!isActualPublicationText(publication.author))
    blockers.push('named author is missing or unresolved');
  if (!isActualProfileUrl(publication.authorProfileUrl))
    blockers.push('author profile URL is missing or unresolved');
  if (!isActualPublicationDate(publication.materiallyUpdatedAt))
    blockers.push('materially updated date is missing or invalid');
  if (!isActualPublicationDate(publication.publishedAt))
    blockers.push('publication date is missing or invalid');

  for (const key of nonRecipeReviewGateKeys) {
    if (
      !hasCompleteNonRecipeGateEvidence(
        publication.reviewGates[key],
        key === 'foodSafety',
      )
    )
      blockers.push(`${key} human-review evidence is incomplete`);
  }

  return { isPublishable: blockers.length === 0, blockers };
}

export function isNonRecipePublishable(
  publication: NonRecipePublication,
): boolean {
  return nonRecipePublicationEligibility(publication).isPublishable;
}

export interface NonRecipePageEligibility {
  readonly isContentPublishable: boolean;
  readonly isIndexable: boolean;
  readonly emitsJsonLd: boolean;
  readonly robotsContent: 'noindex,nofollow,noarchive' | 'index,follow';
  readonly blockers: readonly string[];
}

/**
 * A site-level launch enables indexing only for records that independently
 * satisfy their content review gates. Previews retain their existing global
 * noindex posture regardless of individual record status.
 */
export function nonRecipePageEligibility(
  publication: NonRecipePublication,
  release: Pick<ReleaseState, 'isIndexable'>,
): NonRecipePageEligibility {
  const content = nonRecipePublicationEligibility(publication);
  const isIndexable = release.isIndexable && content.isPublishable;

  return {
    isContentPublishable: content.isPublishable,
    isIndexable,
    emitsJsonLd: isIndexable,
    robotsContent: isIndexable ? 'index,follow' : 'noindex,nofollow,noarchive',
    blockers: content.blockers,
  };
}

export interface RelatedRecipeDataEligibility extends NonRecipePageEligibility {
  readonly canExposeRecipeData: boolean;
}

/**
 * Public menus and tools are only eligible when both their own review record
 * and every recipe represented in their data are publishable. During a
 * non-indexable preview, draft data remains available to the preview audience
 * and retains the release-wide noindex controls.
 */
export function relatedRecipeDataEligibility(
  publication: NonRecipePublication,
  release: Pick<ReleaseState, 'isIndexable'>,
  allReferencedRecipesPublished: boolean,
): RelatedRecipeDataEligibility {
  const page = nonRecipePageEligibility(publication, release);
  const publicDataEligible = page.isIndexable && allReferencedRecipesPublished;
  const blockers = allReferencedRecipesPublished
    ? page.blockers
    : [...page.blockers, 'one or more linked recipes are not published'];
  const isIndexable = release.isIndexable ? publicDataEligible : false;

  return {
    ...page,
    isIndexable,
    emitsJsonLd: isIndexable,
    robotsContent: isIndexable ? 'index,follow' : 'noindex,nofollow,noarchive',
    blockers,
    canExposeRecipeData: release.isIndexable ? publicDataEligible : true,
  };
}

/** The tools surface is separately gated from any menu or recipe record. */
export const planningToolsPublication = createDraftNonRecipePublication();
