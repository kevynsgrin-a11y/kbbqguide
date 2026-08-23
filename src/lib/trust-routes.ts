import trustRouteData from '../../data/trust-route-config.json';
import { privacyNoticeReadiness } from './privacy-notice';

export const trustRouteKeys = [
  'about',
  'contact',
  'privacy-policy',
  'terms',
  'accessibility',
  'editorial-policy',
  'recipe-testing-policy',
  'corrections',
] as const;

export type TrustRouteKey = (typeof trustRouteKeys)[number];
export type TrustRoutePublicationStatus = 'blocked' | 'approved';

interface ApprovalFields {
  readonly publicationStatus: TrustRoutePublicationStatus;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
}

export interface ContactTrustRoute extends ApprovalFields {
  readonly publicContactEmail: string | null;
  readonly inquiryDataRetention: string | null;
}

export interface TermsTrustRoute extends ApprovalFields {
  readonly legalOperatorName: string | null;
  readonly publicContactEmail: string | null;
  readonly effectiveDate: string | null;
  readonly governingLaw: string | null;
  readonly termsBody: string | null;
}

export interface AccessibilityTrustRoute extends ApprovalFields {
  readonly feedbackEmail: string | null;
  readonly lastReviewedAt: string | null;
}

export interface CorrectionsTrustRoute extends ApprovalFields {
  readonly correctionsEmail: string | null;
  readonly processOwner: string | null;
}

export interface TrustRouteConfig {
  readonly version: 1;
  readonly contact: ContactTrustRoute;
  readonly terms: TermsTrustRoute;
  readonly accessibility: AccessibilityTrustRoute;
  readonly corrections: CorrectionsTrustRoute;
}

export interface TrustRoutePublication {
  readonly status: TrustRoutePublicationStatus;
  readonly blockers: readonly string[];
}

export type TrustRouteRobotsContent = 'noindex,nofollow,noarchive' | undefined;

export const trustRouteConfig = trustRouteData as TrustRouteConfig;

function isActualText(value: string | null): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !/\{\{[^}]+\}\}|\b(?:tbd|todo|unknown)\b/i.test(value);
}

function isApprovedDate(value: string | null): value is string {
  if (!isActualText(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new globalThis.Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed.valueOf()) &&
    parsed.toISOString().startsWith(`${value}T00:00:00.000Z`)
  );
}

function isPublicEmail(value: string | null): value is string {
  return (
    isActualText(value) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    !value.endsWith('@example.com')
  );
}

function missingApprovalFields(record: ApprovalFields): string[] {
  const missing: string[] = [];
  if (record.publicationStatus !== 'approved')
    missing.push('publicationStatus');
  if (!isActualText(record.approvedBy)) missing.push('approvedBy');
  if (!isApprovedDate(record.approvedAt)) missing.push('approvedAt');
  return missing;
}

function publicationFromMissing(
  missing: readonly string[],
): TrustRoutePublication {
  return {
    status: missing.length === 0 ? 'approved' : 'blocked',
    blockers: missing,
  };
}

/**
 * A trust route becomes a full public policy only with its accountable factual
 * inputs. The fallback remains a transparent, non-collecting status page; it
 * never fabricates an operator, email address, jurisdiction, or retention
 * practice just to fill a footer link.
 */
export function trustRoutePublication(
  route: TrustRouteKey,
): TrustRoutePublication {
  switch (route) {
    case 'about':
    case 'editorial-policy':
    case 'recipe-testing-policy':
      return { status: 'approved', blockers: [] };
    case 'privacy-policy': {
      const missing = privacyNoticeReadiness().map(
        (field) => `privacy notice: ${field}`,
      );
      return publicationFromMissing(missing);
    }
    case 'contact': {
      const record = trustRouteConfig.contact;
      const missing = missingApprovalFields(record);
      if (!isPublicEmail(record.publicContactEmail))
        missing.push('publicContactEmail');
      if (!isActualText(record.inquiryDataRetention))
        missing.push('inquiryDataRetention');
      return publicationFromMissing(missing);
    }
    case 'terms': {
      const record = trustRouteConfig.terms;
      const missing = missingApprovalFields(record);
      if (!isActualText(record.legalOperatorName))
        missing.push('legalOperatorName');
      if (!isPublicEmail(record.publicContactEmail))
        missing.push('publicContactEmail');
      if (!isApprovedDate(record.effectiveDate)) missing.push('effectiveDate');
      if (!isActualText(record.governingLaw)) missing.push('governingLaw');
      if (!isActualText(record.termsBody)) missing.push('termsBody');
      return publicationFromMissing(missing);
    }
    case 'accessibility': {
      const record = trustRouteConfig.accessibility;
      const missing = missingApprovalFields(record);
      if (!isPublicEmail(record.feedbackEmail)) missing.push('feedbackEmail');
      if (!isApprovedDate(record.lastReviewedAt))
        missing.push('lastReviewedAt');
      return publicationFromMissing(missing);
    }
    case 'corrections': {
      const record = trustRouteConfig.corrections;
      const missing = missingApprovalFields(record);
      if (!isPublicEmail(record.correctionsEmail))
        missing.push('correctionsEmail');
      if (!isActualText(record.processOwner)) missing.push('processOwner');
      return publicationFromMissing(missing);
    }
  }
}

export function isTrustRoutePublished(route: TrustRouteKey): boolean {
  return trustRoutePublication(route).status === 'approved';
}

/**
 * BaseLayout may be indexable in a public launch. Legal-dependent blocked
 * routes must override that default so a status placeholder can never enter a
 * search index merely because the release mode changed.
 */
export function trustRouteRobotsContent(
  route: TrustRouteKey,
): TrustRouteRobotsContent {
  return isTrustRoutePublished(route)
    ? undefined
    : 'noindex,nofollow,noarchive';
}
