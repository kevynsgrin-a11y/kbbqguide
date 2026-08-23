import searchLaunchLogData from '../../data/search-launch-log.json';
import type { ReleaseState } from './release-state';

export interface SearchInspectionRoute {
  readonly id: string;
  readonly inspectionRecordedAt: string | null;
  readonly indexingRequestedAt: string | null;
}

export interface SearchLaunchLog {
  readonly version: 1;
  readonly status: 'blocked' | 'ready' | 'in-progress' | 'complete';
  readonly blockedReason: string | null;
  readonly google: {
    readonly apexVerified: boolean;
    readonly apexVerifiedAt: string | null;
    readonly wwwVerified: boolean;
    readonly wwwVerifiedAt: string | null;
    readonly sitemapSubmittedAt: string | null;
  };
  readonly bing: {
    readonly apexVerified: boolean;
    readonly apexVerifiedAt: string | null;
    readonly wwwVerified: boolean;
    readonly wwwVerifiedAt: string | null;
    readonly sitemapSubmittedAt: string | null;
  };
  readonly representativeRoutes: readonly SearchInspectionRoute[];
  readonly monitoring: {
    readonly owner: string | null;
    readonly weeks: readonly {
      readonly week: number;
      readonly checkedAt: string | null;
      readonly notes: string | null;
    }[];
  };
  readonly firstIndexedAt: string | null;
  readonly issues: readonly string[];
}

export const expectedRepresentativeRouteIds = [
  'SYS_HOME',
  'SYS_RECIPES',
  'CAT_MEAT',
  'M01',
  'G01',
  'MENU_2',
  'SYS_TOOLS',
] as const;

export const searchLaunchLog = searchLaunchLogData as SearchLaunchLog;

function actualText(value: string | null): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !/\{\{[^}]+\}\}|\b(?:tbd|todo|unknown)\b/i.test(value);
}

function recordedTimestamp(value: string | null): value is string {
  if (
    !actualText(value) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ||
    Number.isNaN(globalThis.Date.parse(value))
  )
    return false;
  const normalized = new globalThis.Date(value).toISOString();
  return normalized === value || normalized === value.replace(/Z$/, '.000Z');
}

export interface SearchSubmissionEligibility {
  readonly isReadyForSubmission: boolean;
  readonly blockers: readonly string[];
}

/**
 * Search Console and Bing submission is impossible while a preview is
 * unindexable. This predicate deliberately does not require a previous
 * sitemap submission or 30-day monitoring record: those are evidence that
 * belongs after submission, not a prerequisite for it.
 */
export function searchSubmissionEligibility(
  release: Pick<ReleaseState, 'isIndexable'>,
  log: SearchLaunchLog = searchLaunchLog,
): SearchSubmissionEligibility {
  const blockers: string[] = [];
  if (!release.isIndexable) blockers.push('releaseState.isIndexable');
  if (log.status === 'blocked') blockers.push('status');
  if (!log.google.apexVerified) blockers.push('google.apexVerified');
  if (!recordedTimestamp(log.google.apexVerifiedAt))
    blockers.push('google.apexVerifiedAt');
  if (!log.google.wwwVerified) blockers.push('google.wwwVerified');
  if (!recordedTimestamp(log.google.wwwVerifiedAt))
    blockers.push('google.wwwVerifiedAt');
  if (!log.bing.apexVerified) blockers.push('bing.apexVerified');
  if (!recordedTimestamp(log.bing.apexVerifiedAt))
    blockers.push('bing.apexVerifiedAt');
  if (!log.bing.wwwVerified) blockers.push('bing.wwwVerified');
  if (!recordedTimestamp(log.bing.wwwVerifiedAt))
    blockers.push('bing.wwwVerifiedAt');

  const routeIds = new Set(log.representativeRoutes.map((route) => route.id));
  for (const id of expectedRepresentativeRouteIds) {
    if (!routeIds.has(id)) blockers.push(`representativeRoutes:${id}`);
  }

  return { isReadyForSubmission: blockers.length === 0, blockers };
}

export interface SearchLaunchOperationalReadiness {
  readonly isOperationallyComplete: boolean;
  readonly blockers: readonly string[];
}

/**
 * This verifies the post-submission operating record: both accepted sitemap
 * submissions, the locked inspection set, and four weeks of monitoring.
 */
export function searchLaunchOperationalReadiness(
  release: Pick<ReleaseState, 'isIndexable'>,
  log: SearchLaunchLog = searchLaunchLog,
): SearchLaunchOperationalReadiness {
  const submission = searchSubmissionEligibility(release, log);
  const blockers = [...submission.blockers];
  if (log.status !== 'complete') blockers.push('status:complete');
  if (!recordedTimestamp(log.google.sitemapSubmittedAt))
    blockers.push('google.sitemapSubmittedAt');
  if (!recordedTimestamp(log.bing.sitemapSubmittedAt))
    blockers.push('bing.sitemapSubmittedAt');
  for (const route of log.representativeRoutes) {
    if (!recordedTimestamp(route.inspectionRecordedAt))
      blockers.push(`representativeRoutes:${route.id}:inspectionRecordedAt`);
    if (!recordedTimestamp(route.indexingRequestedAt))
      blockers.push(`representativeRoutes:${route.id}:indexingRequestedAt`);
  }
  if (!actualText(log.monitoring.owner)) blockers.push('monitoring.owner');
  if (
    log.monitoring.weeks.length !== 4 ||
    !log.monitoring.weeks.every(
      (week) =>
        week.week >= 1 &&
        week.week <= 4 &&
        recordedTimestamp(week.checkedAt) &&
        actualText(week.notes),
    )
  ) {
    blockers.push('monitoring.weeks');
  }
  if (!recordedTimestamp(log.firstIndexedAt)) blockers.push('firstIndexedAt');

  return { isOperationallyComplete: blockers.length === 0, blockers };
}

export function assertSearchSubmissionReady(
  release: Pick<ReleaseState, 'isIndexable'>,
): void {
  const eligibility = searchSubmissionEligibility(release);
  if (!eligibility.isReadyForSubmission) {
    throw new Error(
      `Search submission is blocked: ${eligibility.blockers.join(', ')}.`,
    );
  }
}

export function assertSearchLaunchOperationsComplete(
  release: Pick<ReleaseState, 'isIndexable'>,
): void {
  const readiness = searchLaunchOperationalReadiness(release);
  if (!readiness.isOperationallyComplete) {
    throw new Error(
      `Search launch operations are incomplete: ${readiness.blockers.join(', ')}.`,
    );
  }
}
