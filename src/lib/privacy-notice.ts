import privacyNoticeData from '../../data/privacy-notice.json';

export interface PrivacyNoticeDraft {
  readonly version: 1;
  readonly publicationStatus: 'blocked' | 'approved';
  readonly blockedReason: string | null;
  readonly legalOperatorName: string | null;
  readonly privacyContactEmail: string | null;
  readonly postalAddress: string | null;
  readonly effectiveDate: string | null;
  readonly hostingAndEdgeProvider: string | null;
  readonly hostingAndEdgeLogRetention: string | null;
  readonly analyticsProvider: string | null;
  readonly analyticsRetention: string | null;
  readonly analyticsProcessingStatement: string | null;
  readonly analyticsBeaconHost: string | null;
  readonly networkErrorReportingStatement: string | null;
  readonly crossSiteAdvertisingStatement: string | null;
  readonly cookieOrSimilarTechnologyStatement: string | null;
  readonly rightsRequestMethod: string | null;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
}

export interface ApprovedPrivacyNotice {
  readonly legalOperatorName: string;
  readonly privacyContactEmail: string;
  readonly postalAddress: string;
  readonly effectiveDate: string;
  readonly hostingAndEdgeProvider: string;
  readonly hostingAndEdgeLogRetention: string;
  readonly analyticsProvider: string;
  readonly analyticsRetention: string;
  readonly analyticsProcessingStatement: string;
  readonly analyticsBeaconHost: string;
  readonly networkErrorReportingStatement: string;
  readonly crossSiteAdvertisingStatement: string;
  readonly cookieOrSimilarTechnologyStatement: string;
  readonly rightsRequestMethod: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
}

const draft = privacyNoticeData as PrivacyNoticeDraft;

const requiredFields: ReadonlyArray<keyof ApprovedPrivacyNotice> = [
  'legalOperatorName',
  'privacyContactEmail',
  'postalAddress',
  'effectiveDate',
  'hostingAndEdgeProvider',
  'hostingAndEdgeLogRetention',
  'analyticsProvider',
  'analyticsRetention',
  'analyticsProcessingStatement',
  'analyticsBeaconHost',
  'networkErrorReportingStatement',
  'crossSiteAdvertisingStatement',
  'cookieOrSimilarTechnologyStatement',
  'rightsRequestMethod',
  'approvedBy',
  'approvedAt',
];

function isVerifiedValue(value: string | null): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !/\{\{[^}]+\}\}/.test(value);
}

export function privacyNoticeReadiness(): readonly string[] {
  const missing: string[] = requiredFields.filter(
    (field) => !isVerifiedValue(draft[field]),
  );
  if (draft.publicationStatus !== 'approved')
    missing.unshift('publicationStatus');
  if (
    !isVerifiedValue(draft.blockedReason) &&
    draft.publicationStatus === 'blocked'
  )
    missing.push('blockedReason');
  return missing;
}

function materializeApprovedPrivacyNotice(): ApprovedPrivacyNotice {
  return {
    legalOperatorName: draft.legalOperatorName!,
    privacyContactEmail: draft.privacyContactEmail!,
    postalAddress: draft.postalAddress!,
    effectiveDate: draft.effectiveDate!,
    hostingAndEdgeProvider: draft.hostingAndEdgeProvider!,
    hostingAndEdgeLogRetention: draft.hostingAndEdgeLogRetention!,
    analyticsProvider: draft.analyticsProvider!,
    analyticsRetention: draft.analyticsRetention!,
    analyticsProcessingStatement: draft.analyticsProcessingStatement!,
    analyticsBeaconHost: draft.analyticsBeaconHost!,
    networkErrorReportingStatement: draft.networkErrorReportingStatement!,
    crossSiteAdvertisingStatement: draft.crossSiteAdvertisingStatement!,
    cookieOrSimilarTechnologyStatement:
      draft.cookieOrSimilarTechnologyStatement!,
    rightsRequestMethod: draft.rightsRequestMethod!,
    approvedBy: draft.approvedBy!,
    approvedAt: draft.approvedAt!,
  };
}

/**
 * Returns factual policy data only after the full notice has passed its public
 * publication gate. Non-policy consumers can use this to fail closed without
 * converting a missing operator identity into a build error.
 */
export function approvedPrivacyNoticeOrNull(): ApprovedPrivacyNotice | null {
  return privacyNoticeReadiness().length === 0
    ? materializeApprovedPrivacyNotice()
    : null;
}

/**
 * A public route must call this before rendering policy text. It fails closed
 * until a named owner has supplied and approved the factual notice inputs.
 */
export function approvedPrivacyNotice(): ApprovedPrivacyNotice {
  const missing = privacyNoticeReadiness();
  if (missing.length > 0) {
    throw new Error(
      `Privacy notice is not approved for publication. Missing: ${missing.join(', ')}.`,
    );
  }

  return materializeApprovedPrivacyNotice();
}
