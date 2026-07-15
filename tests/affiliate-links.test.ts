import { describe, expect, it } from 'vitest';

import {
  buildAffiliateUrl,
  type MerchantRecord,
} from '../src/lib/affiliate-links';

const pending: MerchantRecord = {
  id: 'merchant-test',
  status: 'not-applied',
  approvedDomains: [],
  affiliateId: null,
  approvedParameterNames: [],
  termsVerifiedAt: null,
  affiliateBuilder: null,
  affiliateIdParameterName: null,
};

const approved: MerchantRecord = {
  id: 'merchant-test',
  status: 'approved',
  approvedDomains: ['merchant.example'],
  affiliateId: 'PLACEHOLDER-TEST-ID',
  approvedParameterNames: ['tag', 'subid'],
  termsVerifiedAt: '2026-07-13',
  affiliateBuilder: 'query-parameters',
  affiliateIdParameterName: 'tag',
};

describe('affiliate URL builder', () => {
  it('rejects inactive merchant records', () => {
    expect(() =>
      buildAffiliateUrl(pending, 'https://merchant.example/item', {}),
    ).toThrow(/not approved/);
  });

  it('allows only approved HTTPS hosts and parameters', () => {
    expect(
      buildAffiliateUrl(approved, 'https://merchant.example/item', {
        subid: 'week-01-card-a',
      }),
    ).toBe(
      'https://merchant.example/item?subid=week-01-card-a&tag=PLACEHOLDER-TEST-ID',
    );
    expect(() =>
      buildAffiliateUrl(approved, 'http://merchant.example/item', {}),
    ).toThrow(/HTTPS/);
    expect(() =>
      buildAffiliateUrl(approved, 'https://attacker.example/item', {}),
    ).toThrow(/not approved/);
    expect(() =>
      buildAffiliateUrl(approved, 'https://merchant.example/item', {
        utm_source: 'email',
      }),
    ).toThrow(/not approved/);
    expect(() =>
      buildAffiliateUrl(
        approved,
        'https://merchant.example/item?tag=attack',
        {},
      ),
    ).toThrow(/query or fragment/);
    expect(() =>
      buildAffiliateUrl(approved, 'https://merchant.example/item', {
        tag: 'attacker-controlled',
      }),
    ).toThrow(/controlled by the registry/);
    expect(() =>
      buildAffiliateUrl(
        approved,
        'https://user:pass@merchant.example/item',
        {},
      ),
    ).toThrow(/credentials/);
  });
});
