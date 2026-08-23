import affiliateDisclosureData from '../../data/affiliate-disclosure.json';
import { hasActiveCommercialModule } from './commercial-activation';

export interface AffiliateDisclosureDraft {
  readonly version: 1;
  readonly publicationStatus: 'blocked' | 'approved';
  readonly effectiveDate: string | null;
  readonly legalOperatorName: string | null;
  readonly contactEmail: string | null;
  readonly adjacentDisclosureCopy: string | null;
  readonly paidLinkRel: readonly string[];
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
}

export interface ApprovedAffiliateDisclosure {
  readonly effectiveDate: string;
  readonly legalOperatorName: string;
  readonly contactEmail: string;
  readonly adjacentDisclosureCopy: string;
  readonly paidLinkRel: 'sponsored nofollow';
  readonly approvedBy: string;
  readonly approvedAt: string;
}

const draft = affiliateDisclosureData as AffiliateDisclosureDraft;

function actualText(value: string | null): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !/\{\{[^}]+\}\}|\b(?:tbd|todo|unknown)\b/i.test(value);
}

function isoDate(value: string | null): value is string {
  if (!actualText(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new globalThis.Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed.valueOf()) &&
    parsed.toISOString().startsWith(`${value}T00:00:00.000Z`)
  );
}

function publicEmail(value: string | null): value is string {
  return (
    actualText(value) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    !value.endsWith('@example.com')
  );
}

/**
 * Disclosure ownership is a separate release gate from merchant approval.
 * Inactive drafts may describe the policy, but they cannot enable paid links.
 */
export function affiliateDisclosureReadiness(): readonly string[] {
  const missing: string[] = [];
  if (draft.publicationStatus !== 'approved') missing.push('publicationStatus');
  if (!isoDate(draft.effectiveDate)) missing.push('effectiveDate');
  if (!actualText(draft.legalOperatorName)) missing.push('legalOperatorName');
  if (!publicEmail(draft.contactEmail)) missing.push('contactEmail');
  if (!actualText(draft.adjacentDisclosureCopy))
    missing.push('adjacentDisclosureCopy');
  if (
    draft.paidLinkRel.length !== 2 ||
    draft.paidLinkRel[0] !== 'sponsored' ||
    draft.paidLinkRel[1] !== 'nofollow'
  )
    missing.push('paidLinkRel');
  if (!actualText(draft.approvedBy)) missing.push('approvedBy');
  if (!isoDate(draft.approvedAt)) missing.push('approvedAt');
  return missing;
}

export function approvedAffiliateDisclosure(): ApprovedAffiliateDisclosure {
  const missing = affiliateDisclosureReadiness();
  if (missing.length > 0) {
    throw new Error(
      `Affiliate disclosure is not approved for paid links. Missing: ${missing.join(', ')}.`,
    );
  }

  return {
    effectiveDate: draft.effectiveDate!,
    legalOperatorName: draft.legalOperatorName!,
    contactEmail: draft.contactEmail!,
    adjacentDisclosureCopy: draft.adjacentDisclosureCopy!,
    paidLinkRel: 'sponsored nofollow',
    approvedBy: draft.approvedBy!,
    approvedAt: draft.approvedAt!,
  };
}

export type AffiliateRelationshipStatus = 'inactive' | 'active';

/**
 * Policy approval is necessary but not sufficient to claim a commercial
 * relationship. At least one independently eligible commercial module must
 * also be active before a UI can use an active relationship state.
 */
export function affiliateRelationshipStatus(
  policyApproved = affiliateDisclosureReadiness().length === 0,
  hasActiveModule = hasActiveCommercialModule(),
): AffiliateRelationshipStatus {
  return policyApproved && hasActiveModule ? 'active' : 'inactive';
}
