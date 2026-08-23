import commercialActivationData from '../../data/commercial-activation.json';

export const commercialActivationGateKeys = [
  'merchantOrProviderContractApproved',
  'exactItemOrServiceEvidenceComplete',
  'adjacentDisclosureCopyApproved',
  'relSponsoredAppliedToPaidLinks',
  'privacyPolicyUpdated',
  'consentAndSuppressionConfiguredIfEmail',
  'priceAndAvailabilityCheckedAtDisplayTime',
  'refundTaxDeliveryTermsPublishedIfPaid',
  'accessibilityQaComplete',
  'securityAndRateLimitReviewComplete',
] as const;

export type CommercialActivationGateKey =
  (typeof commercialActivationGateKeys)[number];

export interface CommercialActivationGates {
  readonly merchantOrProviderContractApproved: boolean;
  readonly exactItemOrServiceEvidenceComplete: boolean;
  readonly adjacentDisclosureCopyApproved: boolean;
  readonly relSponsoredAppliedToPaidLinks: boolean;
  readonly privacyPolicyUpdated: boolean;
  readonly consentAndSuppressionConfiguredIfEmail: boolean;
  readonly priceAndAvailabilityCheckedAtDisplayTime: boolean;
  readonly refundTaxDeliveryTermsPublishedIfPaid: boolean;
  readonly accessibilityQaComplete: boolean;
  readonly securityAndRateLimitReviewComplete: boolean;
}

export interface CommercialActivationRecord {
  readonly moduleId: string;
  readonly status: 'disabled' | 'active';
  readonly collectsEmail: boolean;
  readonly offersPaidService: boolean;
  readonly gates: CommercialActivationGates;
}

interface CommercialActivationCatalog {
  readonly version: 1;
  readonly modules: readonly CommercialActivationRecord[];
}

export const commercialActivationCatalog =
  commercialActivationData as CommercialActivationCatalog;

export interface CommercialActivationEligibility {
  readonly isActive: boolean;
  readonly blockers: readonly string[];
}

/**
 * This is the sole code-level predicate for activating a commercial module.
 * An inactive module is not an error; an active module without every listed
 * gate is invalid and must fail the build/release check.
 */
export function commercialActivationEligibility(
  record: CommercialActivationRecord,
): CommercialActivationEligibility {
  const blockers: string[] = [];
  if (record.status !== 'active') blockers.push('module is disabled');

  for (const gate of commercialActivationGateKeys) {
    if (!record.gates[gate]) blockers.push(gate);
  }

  return { isActive: blockers.length === 0, blockers };
}

export function commercialActivationRecord(
  moduleId: string,
): CommercialActivationRecord {
  const matches = commercialActivationCatalog.modules.filter(
    (record) => record.moduleId === moduleId,
  );
  if (matches.length !== 1)
    throw new Error(
      `Expected exactly one commercial activation record for ${moduleId}.`,
    );
  const record = matches[0];
  if (!record)
    throw new Error(`Missing commercial activation record for ${moduleId}.`);
  return record;
}

export function assertCommercialModuleActive(moduleId: string): void {
  const record = commercialActivationRecord(moduleId);
  const eligibility = commercialActivationEligibility(record);
  if (!eligibility.isActive) {
    throw new Error(
      `Commercial module ${moduleId} is not eligible for activation: ${eligibility.blockers.join(', ')}.`,
    );
  }
}

/**
 * A policy can be approved before any module is actually eligible to use it.
 * UI surfaces must use this predicate to avoid implying an active relationship
 * merely because disclosure wording has been reviewed.
 */
export function hasActiveCommercialModule(): boolean {
  return commercialActivationCatalog.modules.some(
    (record) => commercialActivationEligibility(record).isActive,
  );
}
