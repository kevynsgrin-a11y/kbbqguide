import { describe, expect, it } from 'vitest';

import {
  approvedPrivacyNotice,
  privacyNoticeReadiness,
} from '../src/lib/privacy-notice';

describe('privacy-notice publication gate', () => {
  it('fails closed until the owner supplies and approves the required factual inputs', () => {
    expect(privacyNoticeReadiness()).toEqual(
      expect.arrayContaining([
        'publicationStatus',
        'legalOperatorName',
        'privacyContactEmail',
        'postalAddress',
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
});
