/**
 * The release state is deliberately separate from content publication. It
 * controls crawl/discovery posture for the entire site and refuses to treat a
 * public URL as either a protected preview or a public launch on the basis of
 * a label alone.
 *
 * An edge control is still required for `restricted-preview`: this module can
 * require and record an operator verification, but static Astro output cannot
 * create a Cloudflare Access application or HTTP-auth credential by itself.
 */
export const releaseModes = [
  'public-noindex-preview',
  'restricted-preview',
  'public-launch',
] as const;

export type ReleaseMode = (typeof releaseModes)[number];

export const accessControlMethods = [
  'cloudflare-access',
  'http-basic-auth',
] as const;

export type AccessControlMethod = (typeof accessControlMethods)[number];

export interface ReleaseStateInput {
  /** Requested deployment posture; an unknown or absent value fails closed. */
  readonly mode?: string | null;
  /** Edge control selected for a restricted preview. */
  readonly accessControl?: string | null;
  /** Must be the literal `verified` after an authenticated edge check. */
  readonly accessVerified?: string | null;
  /** Must be the literal `approved` before a public launch is allowed. */
  readonly publicReleaseApproved?: string | null;
  /** Must be the literal `approved` before crawlers may be invited in. */
  readonly indexingApproved?: string | null;
}

export interface ReleaseState {
  readonly requestedMode: string | null;
  readonly mode: ReleaseMode;
  readonly accessControl: AccessControlMethod | null;
  readonly requiresEdgeAuthentication: boolean;
  readonly isIndexable: boolean;
  readonly exposesXmlSitemap: boolean;
  readonly metaRobots: 'noindex,nofollow,noarchive' | 'index,follow';
  readonly robotsPolicy: 'disallow-all' | 'allow-all';
  readonly blockers: readonly string[];
}

function normalized(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function isReleaseMode(value: string | null): value is ReleaseMode {
  return value !== null && (releaseModes as readonly string[]).includes(value);
}

function accessControlMethod(value: string | null): AccessControlMethod | null {
  return value !== null &&
    (accessControlMethods as readonly string[]).includes(value)
    ? (value as AccessControlMethod)
    : null;
}

function safePreview(
  requestedMode: string | null,
  blockers: readonly string[],
): ReleaseState {
  return {
    requestedMode,
    mode: 'public-noindex-preview',
    accessControl: null,
    requiresEdgeAuthentication: false,
    isIndexable: false,
    exposesXmlSitemap: false,
    metaRobots: 'noindex,nofollow,noarchive',
    // A public preview must let compliant crawlers fetch the HTML and observe
    // its noindex directive; Disallow: / can preserve already-indexed URLs.
    robotsPolicy: 'allow-all',
    blockers,
  };
}

/**
 * Resolve a deploy posture without trusting a requested mode by itself.
 *
 * `public-noindex-preview` is the truthful safe fallback for a public host
 * which is not yet behind an authenticated edge control. It does not claim to
 * be private. `restricted-preview` remains non-indexable, and becomes active
 * only after the designated Access/basic-auth protection was independently
 * verified. `public-launch` requires two explicit approvals.
 */
export function resolveReleaseState(
  input: ReleaseStateInput = {},
): ReleaseState {
  const requestedMode = normalized(input.mode);
  const accessControl = accessControlMethod(normalized(input.accessControl));
  const accessVerified = normalized(input.accessVerified) === 'verified';
  const publicReleaseApproved =
    normalized(input.publicReleaseApproved) === 'approved';
  const indexingApproved = normalized(input.indexingApproved) === 'approved';

  if (requestedMode === null || requestedMode === 'public-noindex-preview') {
    return safePreview(requestedMode, []);
  }

  if (!isReleaseMode(requestedMode)) {
    return safePreview(requestedMode, [
      'Unknown release mode; using public-noindex-preview.',
    ]);
  }

  if (requestedMode === 'restricted-preview') {
    if (!accessControl || !accessVerified) {
      return safePreview(requestedMode, [
        'Restricted preview requires verified Cloudflare Access or HTTP basic auth at the edge.',
      ]);
    }

    return {
      requestedMode,
      mode: 'restricted-preview',
      accessControl,
      requiresEdgeAuthentication: true,
      isIndexable: false,
      exposesXmlSitemap: false,
      metaRobots: 'noindex,nofollow,noarchive',
      robotsPolicy: 'disallow-all',
      blockers: [],
    };
  }

  if (!publicReleaseApproved || !indexingApproved) {
    const blockers: string[] = [];
    if (!publicReleaseApproved)
      blockers.push('Public release approval is required before launch.');
    if (!indexingApproved)
      blockers.push(
        'Indexing approval is required before crawlers are invited.',
      );
    return safePreview(requestedMode, blockers);
  }

  return {
    requestedMode,
    mode: 'public-launch',
    accessControl: null,
    requiresEdgeAuthentication: false,
    isIndexable: true,
    exposesXmlSitemap: true,
    metaRobots: 'index,follow',
    robotsPolicy: 'allow-all',
    blockers: [],
  };
}

/**
 * Build-time configuration. These server-only environment variables are
 * intentionally unprefixed so they cannot be surfaced to browser bundles.
 */
export const releaseState = resolveReleaseState({
  mode: import.meta.env.KBBQGUIDE_RELEASE_MODE,
  accessControl: import.meta.env.KBBQGUIDE_ACCESS_CONTROL,
  accessVerified: import.meta.env.KBBQGUIDE_ACCESS_VERIFIED,
  publicReleaseApproved: import.meta.env.KBBQGUIDE_PUBLIC_RELEASE_APPROVED,
  indexingApproved: import.meta.env.KBBQGUIDE_INDEXING_APPROVED,
});
