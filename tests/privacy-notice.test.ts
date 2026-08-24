import { describe, expect, it } from 'vitest';

import privacyNoticeData from '../data/privacy-notice.json';
import {
  approvedPrivacyNotice,
  privacyNoticeReadiness,
  privacyNoticeReadinessFor,
  type PrivacyNoticeDraft,
} from '../src/lib/privacy-notice';

const approvedFixture: PrivacyNoticeDraft = {
  version: 1,
  publicationStatus: 'approved',
  blockedReason: null,
  legalOperatorName: 'Verified Operator LLC',
  privacyContactEmail: 'privacy@operator.test',
  postalAddress: '1 Review Lane, Sacramento, CA 95816',
  effectiveDate: '2026-08-23',
  hostingAndEdgeProvider: 'Verified hosting provider',
  hostingAndEdgeLogRetention: 'Verified log-retention statement',
  analyticsProvider: 'Verified analytics provider',
  analyticsRetention: 'Verified analytics-retention statement',
  analyticsProcessingStatement: 'Verified analytics processing statement',
  analyticsBeaconHost: 'analytics.operator.test',
  networkErrorReportingStatement: 'Verified network-error statement',
  crossSiteAdvertisingStatement: 'Verified advertising statement',
  cookieOrSimilarTechnologyStatement: 'Verified cookie statement',
  rightsRequestMethod: 'Email the verified privacy contact.',
  approvedBy: 'Verified approver',
  approvedAt: '2026-08-23',
};

describe('privacy-notice publication gate', () => {
  it('records owner-supplied operator facts but still fails closed until the remaining factual inputs are approved', () => {
    expect(privacyNoticeData.legalOperatorName).toBe(
      'Oak and Main Developers LLC',
    );
    expect(privacyNoticeData.postalAddress).toBe(
      '2108 N St., Sacramento, CA 95816',
    );
    expect(privacyNoticeReadiness()).not.toEqual(
      expect.arrayContaining(['legalOperatorName', 'postalAddress']),
    );
    expect(privacyNoticeReadiness()).toEqual(
      expect.arrayContaining([
        'publicationStatus',
        'privacyContactEmail',
        'hostingAndEdgeLogRetention',
        'analyticsRetention',
        'rightsRequestMethod',
        'approvedBy',
        'approvedAt',
      ]),
    );
    expect(approvedPrivacyNotice).toThrow(
      'Privacy notice is not approved for publication.',
    );
  });

  it('rejects malformed contact/date facts and a leftover blocker on a purported approval', () => {
    expect(
      privacyNoticeReadinessFor({
        ...approvedFixture,
        privacyContactEmail: 'not-an-email',
        effectiveDate: '2026-02-30',
        approvedAt: 'not-a-date',
        rightsRequestMethod: 'TBD',
        blockedReason: 'Still blocked',
      }),
    ).toEqual(
      expect.arrayContaining([
        'privacyContactEmail',
        'effectiveDate',
        'approvedAt',
        'rightsRequestMethod',
        'blockedReason',
      ]),
    );
  });
});
