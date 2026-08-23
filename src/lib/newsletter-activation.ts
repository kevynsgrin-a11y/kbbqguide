import automationData from '../../data/automation-registry.json';
import newsletterActivationData from '../../data/newsletter-activation.json';

export type NewsletterActivationStatus = 'disabled' | 'active';
export type DoubleOptInDecision =
  'undecided' | 'required-and-configured' | 'not-required-with-reason';

export interface NewsletterActivationRecord {
  readonly version: 1;
  readonly status: NewsletterActivationStatus;
  readonly provider: string | null;
  readonly exactListPurpose: string | null;
  readonly explicitUncheckedConsent: boolean;
  readonly doubleOptInDecision: DoubleOptInDecision;
  readonly doubleOptInExceptionRationale: string | null;
  readonly doubleOptInExceptionLegalApproval: boolean;
  readonly providerDataProcessingAgreementApproved: boolean;
  readonly providerRetentionPeriod: string | null;
  readonly legalPostalAddress: string | null;
  readonly oneClickUnsubscribeConfigured: boolean;
  readonly durableSuppressionListConfigured: boolean;
  readonly preferenceCenterConfigured: boolean;
  readonly prohibitsInferredTagsFromMessagesAndBrowsing: boolean;
  readonly deletionAndExportProcess: string | null;
  readonly accessibleStatesVerified: boolean;
  readonly privacyPreservingRateLimitAndBotProtection: string | null;
  readonly privacyPolicyUpdated: boolean;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
}

interface AutomationRegistryState {
  readonly providersConfigured: boolean;
  readonly collectionEnabled: boolean;
}

export const newsletterActivation =
  newsletterActivationData as NewsletterActivationRecord;
const automation = automationData as AutomationRegistryState;

function actualText(value: string | null): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !/\{\{[^}]+\}\}|\b(?:tbd|todo|unknown)\b/i.test(value);
}

function approvedDate(value: string | null): value is string {
  if (!actualText(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new globalThis.Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed.valueOf()) &&
    parsed.toISOString().startsWith(`${value}T00:00:00.000Z`)
  );
}

export interface NewsletterActivationEligibility {
  readonly isActive: boolean;
  readonly blockers: readonly string[];
}

/**
 * Newsletter activation is intentionally stricter than a provider login.
 * The same record gates a form action, data collection, automated sends, and
 * subscriber segmentation so any missing privacy safeguard leaves all four
 * disabled.
 */
export function newsletterActivationEligibility(
  record: NewsletterActivationRecord = newsletterActivation,
  automationState: AutomationRegistryState = automation,
): NewsletterActivationEligibility {
  const blockers: string[] = [];
  if (record.status !== 'active') blockers.push('status');
  if (!actualText(record.provider)) blockers.push('provider');
  if (!actualText(record.exactListPurpose)) blockers.push('exactListPurpose');
  if (!record.explicitUncheckedConsent)
    blockers.push('explicitUncheckedConsent');
  if (record.doubleOptInDecision === 'undecided')
    blockers.push('doubleOptInDecision');
  if (
    record.doubleOptInDecision === 'not-required-with-reason' &&
    !actualText(record.doubleOptInExceptionRationale)
  ) {
    blockers.push('doubleOptInExceptionRationale');
  }
  if (
    record.doubleOptInDecision === 'not-required-with-reason' &&
    !record.doubleOptInExceptionLegalApproval
  ) {
    blockers.push('doubleOptInExceptionLegalApproval');
  }
  if (!record.providerDataProcessingAgreementApproved)
    blockers.push('providerDataProcessingAgreementApproved');
  if (!actualText(record.providerRetentionPeriod))
    blockers.push('providerRetentionPeriod');
  if (!actualText(record.legalPostalAddress))
    blockers.push('legalPostalAddress');
  if (!record.oneClickUnsubscribeConfigured)
    blockers.push('oneClickUnsubscribeConfigured');
  if (!record.durableSuppressionListConfigured)
    blockers.push('durableSuppressionListConfigured');
  if (!record.preferenceCenterConfigured)
    blockers.push('preferenceCenterConfigured');
  if (!record.prohibitsInferredTagsFromMessagesAndBrowsing)
    blockers.push('prohibitsInferredTagsFromMessagesAndBrowsing');
  if (!actualText(record.deletionAndExportProcess))
    blockers.push('deletionAndExportProcess');
  if (!record.accessibleStatesVerified)
    blockers.push('accessibleStatesVerified');
  if (!actualText(record.privacyPreservingRateLimitAndBotProtection))
    blockers.push('privacyPreservingRateLimitAndBotProtection');
  if (!record.privacyPolicyUpdated) blockers.push('privacyPolicyUpdated');
  if (!actualText(record.approvedBy)) blockers.push('approvedBy');
  if (!approvedDate(record.approvedAt)) blockers.push('approvedAt');
  if (!automationState.providersConfigured)
    blockers.push('providersConfigured');
  if (!automationState.collectionEnabled) blockers.push('collectionEnabled');

  return { isActive: blockers.length === 0, blockers };
}

export function assertNewsletterActivation(): void {
  const eligibility = newsletterActivationEligibility();
  if (!eligibility.isActive) {
    throw new Error(
      `Newsletter activation is blocked: ${eligibility.blockers.join(', ')}.`,
    );
  }
}
