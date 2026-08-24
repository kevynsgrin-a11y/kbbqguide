import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import privacyData from '../data/privacy-notice.json';
import revenueData from '../data/revenue-modules.json';
import registryData from '../data/url-registry.json';
import {
  affiliateDisclosureReadiness,
  affiliateRelationshipStatus,
  approvedAffiliateDisclosure,
} from '../src/lib/affiliate-policy';
import { buildActivatedAffiliateLink } from '../src/lib/affiliate-links';
import {
  commercialActivationCatalog,
  commercialActivationEligibility,
  hasActiveCommercialModule,
  type CommercialActivationRecord,
} from '../src/lib/commercial-activation';
import {
  assertNewsletterActivation,
  newsletterActivation,
  newsletterActivationEligibility,
  type NewsletterActivationRecord,
} from '../src/lib/newsletter-activation';
import {
  approvedPrivacyNotice,
  privacyNoticeReadiness,
} from '../src/lib/privacy-notice';
import {
  expectedRepresentativeRouteIds,
  searchLaunchLog,
  searchLaunchOperationalReadiness,
  searchSubmissionEligibility,
  type SearchLaunchLog,
} from '../src/lib/search-launch';
import {
  trustRouteConfig,
  trustRoutePublication,
  trustRouteRobotsContent,
} from '../src/lib/trust-routes';
import { registryPathById, type UrlRegistry } from '../src/lib/url-registry';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');
const registry = registryData as UrlRegistry;

describe('P1 governance, privacy, commercial, and search operating gates', () => {
  it('keeps legal-dependent trust routes explicitly noindex even if a later release defaults to indexable', () => {
    expect(registryPathById(registry, 'POL_PRIVACY')).toBe('/privacy-policy/');
    expect(trustRouteConfig.terms.legalOperatorName).toBe(
      'Oak and Main Developers LLC',
    );
    expect(registryPathById(registry, 'POL_CORRECTIONS')).toBe('/corrections/');
    expect(registry.redirects).toContainEqual({
      from: '/privacy/',
      toId: 'POL_PRIVACY',
    });
    expect(source('public/_redirects')).toMatch(
      /^\/privacy\/\s+\/privacy-policy\/\s+301$/m,
    );

    for (const route of [
      'contact',
      'privacy-policy',
      'terms',
      'accessibility',
      'corrections',
    ] as const) {
      expect(trustRoutePublication(route).status).toBe('blocked');
      // This must override a hypothetical public-launch `index,follow` default.
      expect(trustRouteRobotsContent(route)).toBe('noindex,nofollow,noarchive');
    }
    expect(trustRouteRobotsContent('about')).toBeUndefined();
    expect(trustRouteRobotsContent('editorial-policy')).toBeUndefined();
    expect(trustRouteRobotsContent('recipe-testing-policy')).toBeUndefined();

    for (const page of [
      'src/pages/contact.astro',
      'src/pages/privacy-policy.astro',
      'src/pages/terms.astro',
      'src/pages/accessibility.astro',
      'src/pages/corrections.astro',
    ]) {
      expect(source(page)).toContain('trustRouteRobotsContent');
      expect(source(page)).toContain('{robotsContent}');
    }
    expect(source('src/pages/privacy-policy.astro')).toContain(
      'notice.postalAddress',
    );
    expect(source('src/pages/privacy-policy.astro')).toContain('<address>');
  });

  it('records the observed Cloudflare analytics disclosure without inventing legal or retention facts', () => {
    expect(privacyData.analyticsProvider).toBe('Cloudflare Web Analytics');
    expect(privacyData.analyticsProcessingStatement).toBe(
      'We use Cloudflare Web Analytics to receive aggregate page-view and performance measurements.',
    );
    expect(privacyData.analyticsBeaconHost).toBe(
      'static.cloudflareinsights.com',
    );
    expect(privacyData.networkErrorReportingStatement).toBe(
      'Cloudflare also receives standard hosting, security, and network-error data when it delivers the site.',
    );
    expect(privacyData.crossSiteAdvertisingStatement).toBe(
      'We do not use this information for cross-site advertising profiles.',
    );
    expect(privacyData.legalOperatorName).toBe('Oak and Main Developers LLC');
    expect(privacyData.postalAddress).toBe('2108 N St., Sacramento, CA 95816');
    expect(privacyNoticeReadiness()).toEqual(
      expect.arrayContaining([
        'publicationStatus',
        'privacyContactEmail',
        'hostingAndEdgeLogRetention',
        'analyticsRetention',
      ]),
    );
    expect(approvedPrivacyNotice).toThrow('not approved for publication');
  });

  it('requires policy approval and an active commercial module before a relationship can be shown', () => {
    expect(
      new Set(
        commercialActivationCatalog.modules.map((record) => record.moduleId),
      ),
    ).toEqual(new Set(revenueData.modules.map((module) => module.id)));
    expect(hasActiveCommercialModule()).toBe(false);
    expect(affiliateRelationshipStatus(true, false)).toBe('inactive');
    expect(affiliateRelationshipStatus(false, true)).toBe('inactive');
    expect(affiliateRelationshipStatus(true, true)).toBe('active');
    expect(affiliateDisclosureReadiness()).toEqual(
      expect.arrayContaining([
        'publicationStatus',
        'effectiveDate',
        'legalOperatorName',
        'contactEmail',
        'adjacentDisclosureCopy',
        'paidLinkRel',
      ]),
    );
    expect(approvedAffiliateDisclosure).toThrow('not approved for paid links');

    for (const record of commercialActivationCatalog.modules) {
      expect(record.status).toBe('disabled');
      expect(commercialActivationEligibility(record)).toMatchObject({
        isActive: false,
      });
    }

    const firstCommercialModule = commercialActivationCatalog.modules[0];
    if (!firstCommercialModule)
      throw new Error('Expected at least one commercial activation record.');
    const syntheticReadyRecord: CommercialActivationRecord = {
      ...firstCommercialModule,
      status: 'active',
      gates: {
        merchantOrProviderContractApproved: true,
        exactItemOrServiceEvidenceComplete: true,
        adjacentDisclosureCopyApproved: true,
        relSponsoredAppliedToPaidLinks: true,
        privacyPolicyUpdated: true,
        consentAndSuppressionConfiguredIfEmail: true,
        priceAndAvailabilityCheckedAtDisplayTime: true,
        refundTaxDeliveryTermsPublishedIfPaid: true,
        accessibilityQaComplete: true,
        securityAndRateLimitReviewComplete: true,
      },
    };
    expect(commercialActivationEligibility(syntheticReadyRecord).isActive).toBe(
      true,
    );
    expect(() =>
      buildActivatedAffiliateLink(
        'REV_PANTRY',
        {
          id: 'test',
          status: 'approved',
          approvedDomains: ['merchant.example'],
          affiliateId: 'id',
          approvedParameterNames: ['id'],
          termsVerifiedAt: '2026-08-23',
          affiliateBuilder: 'query-parameters',
          affiliateIdParameterName: 'id',
        },
        'https://merchant.example/item',
        {},
      ),
    ).toThrow('Commercial module REV_PANTRY is not eligible for activation');
  });

  it('requires a reviewed legal exception before double opt-in may be waived', () => {
    expect(newsletterActivationEligibility().isActive).toBe(false);
    expect(assertNewsletterActivation).toThrow(
      'Newsletter activation is blocked',
    );

    const exceptionWithoutApproval: NewsletterActivationRecord = {
      ...newsletterActivation,
      status: 'active',
      provider: 'Approved email provider',
      exactListPurpose:
        'Send the subscriber the explicitly requested weekly email.',
      explicitUncheckedConsent: true,
      doubleOptInDecision: 'not-required-with-reason',
      doubleOptInExceptionRationale: null,
      doubleOptInExceptionLegalApproval: false,
      providerDataProcessingAgreementApproved: true,
      providerRetentionPeriod: 'Approved retention period',
      legalPostalAddress: 'Approved legal postal address',
      oneClickUnsubscribeConfigured: true,
      durableSuppressionListConfigured: true,
      preferenceCenterConfigured: true,
      prohibitsInferredTagsFromMessagesAndBrowsing: true,
      deletionAndExportProcess: 'Approved deletion and export process',
      accessibleStatesVerified: true,
      privacyPreservingRateLimitAndBotProtection:
        'Approved privacy-preserving rate limit',
      privacyPolicyUpdated: true,
      approvedBy: 'Accountable approver',
      approvedAt: '2026-08-23',
    };
    expect(
      newsletterActivationEligibility(exceptionWithoutApproval, {
        providersConfigured: true,
        collectionEnabled: true,
      }).blockers,
    ).toEqual(
      expect.arrayContaining([
        'doubleOptInExceptionRationale',
        'doubleOptInExceptionLegalApproval',
      ]),
    );
  });

  it('requires phase-specific valid timestamps for search submission and 30-day completion', () => {
    expect(expectedRepresentativeRouteIds).toEqual([
      'SYS_HOME',
      'SYS_RECIPES',
      'CAT_MEAT',
      'M01',
      'G01',
      'MENU_2',
      'SYS_TOOLS',
    ]);

    const verifiedWithoutTimestamps: SearchLaunchLog = {
      ...searchLaunchLog,
      status: 'ready',
      google: {
        ...searchLaunchLog.google,
        apexVerified: true,
        wwwVerified: true,
      },
      bing: {
        ...searchLaunchLog.bing,
        apexVerified: true,
        wwwVerified: true,
      },
    };
    expect(
      searchSubmissionEligibility(
        { isIndexable: true },
        verifiedWithoutTimestamps,
      ).blockers,
    ).toEqual(
      expect.arrayContaining([
        'google.apexVerifiedAt',
        'google.wwwVerifiedAt',
        'bing.apexVerifiedAt',
        'bing.wwwVerifiedAt',
      ]),
    );

    const verifiedAt = '2026-08-23T12:00:00.000Z';
    const submittedWithoutOperations: SearchLaunchLog = {
      ...verifiedWithoutTimestamps,
      status: 'in-progress',
      google: {
        ...verifiedWithoutTimestamps.google,
        apexVerifiedAt: verifiedAt,
        wwwVerifiedAt: verifiedAt,
      },
      bing: {
        ...verifiedWithoutTimestamps.bing,
        apexVerifiedAt: verifiedAt,
        wwwVerifiedAt: verifiedAt,
      },
    };
    expect(
      searchLaunchOperationalReadiness(
        { isIndexable: true },
        submittedWithoutOperations,
      ).blockers,
    ).toEqual(
      expect.arrayContaining([
        'status:complete',
        'google.sitemapSubmittedAt',
        'bing.sitemapSubmittedAt',
        'representativeRoutes:SYS_HOME:inspectionRecordedAt',
        'representativeRoutes:SYS_HOME:indexingRequestedAt',
        'monitoring.weeks',
        'firstIndexedAt',
      ]),
    );
    expect(existsSync(resolve(root, 'docs/SEARCH-LAUNCH-RUNBOOK.md'))).toBe(
      true,
    );
  });
});
