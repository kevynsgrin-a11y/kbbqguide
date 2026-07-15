import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import affiliateData from '../data/affiliate-registry.json';
import analyticsData from '../data/analytics-event-registry.json';
import automationData from '../data/automation-registry.json';
import allowlistData from '../data/outbound-domain-allowlist.json';
import releaseData from '../data/release-matrix.json';
import revenueData from '../data/revenue-modules.json';
import registryData from '../data/url-registry.json';
import stateData from '../project-state.json';
import type { UrlRegistry } from '../src/lib/url-registry';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');
const registry = registryData as UrlRegistry;

describe('Phase 6 revenue, social, email, messaging, and analytics handoff gate', () => {
  it('seeds exactly nine inactive merchants with every permission unresolved and no destination', () => {
    expect(affiliateData.merchants).toHaveLength(9);
    expect(
      new Set(affiliateData.merchants.map((merchant) => merchant.id)).size,
    ).toBe(9);
    for (const merchant of affiliateData.merchants) {
      expect(merchant).toMatchObject({
        status: 'not-applied',
        termsVerifiedAt: null,
        affiliateId: null,
        approvedDomains: [],
        approvedParameterNames: [],
        affiliateBuilder: null,
        affiliateIdParameterName: null,
        emailLinkPermission: 'unknown',
        socialLinkPermission: 'unknown',
        priceDisplayPermission: 'unknown',
        apiPermission: 'unknown',
      });
    }
    expect(allowlistData.allowedDomains).toEqual([]);
    expect(JSON.stringify(affiliateData)).not.toMatch(/https?:\/\//);
  });

  it('keeps all recommendation and advertising contracts disabled', () => {
    expect(revenueData.modules).toHaveLength(7);
    expect(revenueData.adSlots).toHaveLength(4);
    expect(
      revenueData.modules.every((module) => module.status === 'disabled'),
    ).toBe(true);
    expect(
      revenueData.adSlots.every((slot) => slot.status === 'disabled'),
    ).toBe(true);
    expect(JSON.stringify(revenueData)).not.toMatch(
      /price checked|in stock|coupon|discount/i,
    );
    expect(source('src/components/DisabledAdSlot.astro')).toContain(
      'data-ad-status="disabled"',
    );
  });

  it('renders adjacent material-connection language without active paid destinations', () => {
    const disclosure = source('src/components/AffiliateDisclosure.astro');
    const shop = source('src/pages/shop/index.astro');
    expect(disclosure).toContain('data-affiliate-status="inactive"');
    expect(disclosure).toContain('No affiliate relationship is active');
    expect(shop).toContain('<AffiliateDisclosure');
    expect(shop).not.toMatch(/href=["']https?:/);
    expect(source('src/pages/affiliate-disclosure.astro')).toContain(
      'mark paid links as sponsored',
    );
    expect(source('src/pages/sponsored-content-policy.astro')).toContain(
      'Editorial independence',
    );
  });

  it('keeps every preview intake form inert and explicit about collection', () => {
    const form = source('src/components/DisabledForm.astro');
    expect(form).toContain('data-collection-status="disabled"');
    expect(form).toContain('<form');
    expect(form).not.toMatch(/<form[^>]+action=/);
    expect(form).toMatch(/<textarea\s+disabled/);
    expect(form).toContain('<input');
    expect(form).toContain('disabled');
    expect(form).toMatch(/<button[^>]+disabled/);
    for (const page of [
      'src/pages/newsletter/index.astro',
      'src/pages/live-class.astro',
      'src/pages/media-kit.astro',
      'src/pages/licensing-inquiry.astro',
      'src/pages/brand-partnerships.astro',
    ])
      expect(source(page)).toContain('<DisabledForm');
  });

  it('locks a ninety-day Los Angeles draft calendar to the exact fifty-two-record release matrix', () => {
    const rows = source('docs/social-calendar-90-days.csv').trim().split('\n');
    expect(rows).toHaveLength(91);
    expect(rows[0]).toContain('timezone');
    const dataRows = rows.slice(1);
    expect(dataRows.every((row) => row.includes('"America/Los_Angeles"'))).toBe(
      true,
    );
    expect(dataRows.every((row) => row.includes('"planned-draft"'))).toBe(true);
    const calendarIds = dataRows
      .map((row) => row.match(/"((?:M|SF|B|F|SA|D)\d{2})"/)?.[1])
      .filter((id): id is string => Boolean(id));
    const releaseIds = releaseData.remaining.weeks.flatMap((week) => week.ids);
    expect(calendarIds).toHaveLength(52);
    expect(new Set(calendarIds)).toEqual(new Set(releaseIds));
    expect(
      new Set(dataRows.map((row) => row.match(/,"(\d{1,2})",/)?.[1])),
    ).toContain('13');
  });

  it('defines consent-aware email and messaging drafts without configuring providers', () => {
    expect(automationData.providersConfigured).toBe(false);
    expect(automationData.collectionEnabled).toBe(false);
    expect(automationData.interestTags).toHaveLength(11);
    expect(
      automationData.welcomeSequence.map((message) => message.day),
    ).toEqual([0, 2, 4, 7, 10]);
    expect(
      automationData.directMessageFlows.map((flow) => flow.keyword),
    ).toEqual(['PLAN', 'MARINADE', 'BANCHAN', 'SHOP']);
    expect(automationData.sms).toMatchObject({
      status: 'disabled',
      minimumDelayDays: 30,
      legalReviewRequired: true,
    });
  });

  it('allowlists eighteen privacy-minimal analytics events while collection stays off', () => {
    expect(analyticsData.collectionEnabled).toBe(false);
    expect(analyticsData.provider).toBeNull();
    expect(analyticsData.events).toHaveLength(18);
    expect(new Set(analyticsData.events.map((event) => event.name)).size).toBe(
      18,
    );
    expect(analyticsData.globalProhibitedParameters).toEqual(
      expect.arrayContaining([
        'email',
        'name',
        'phone',
        'user_id',
        'free_text',
      ]),
    );
    for (const event of analyticsData.events) {
      expect(['analytics', 'marketing']).toContain(event.consent);
      expect(
        event.allowedParameters.some((parameter) =>
          analyticsData.globalProhibitedParameters.includes(parameter),
        ),
      ).toBe(false);
    }
  });

  it('provides every required operating and compliance artifact', () => {
    for (const file of [
      'docs/AFFILIATE-COMPLIANCE.md',
      'docs/affiliate-registry.csv',
      'docs/AD-PLACEMENT-POLICY.md',
      'docs/90-DAY-GROWTH-PLAN.md',
      'docs/social-calendar-90-days.csv',
      'docs/content-atomization-template.md',
      'docs/email-automation-map.md',
      'docs/messaging-automation-map.md',
      'docs/analytics-event-plan.md',
      'docs/PROVIDER-SETUP.md',
    ])
      expect(existsSync(resolve(root, file)), file).toBe(true);
    expect(
      source('docs/affiliate-registry.csv').trim().split('\n'),
    ).toHaveLength(10);
  });

  it('adds only registry-backed implemented Phase 6 routes', () => {
    expect(registry.entries).toHaveLength(125);
    expect(
      registry.entries.filter((entry) => entry.type === 'recipe'),
    ).toHaveLength(80);
    for (const id of [
      'SYS_SHOP',
      'SYS_NEWSLETTER',
      'POL_AFFILIATE',
      'POL_SPONSORED',
      'SYS_CLASS',
      'SYS_MEDIA_KIT',
      'SYS_LICENSING',
      'SYS_PARTNERSHIPS',
    ])
      expect(registry.entries.filter((entry) => entry.id === id)).toHaveLength(
        1,
      );
  });

  it('preserves the completed Phase 6 record without merchants, collection, ads, publishing, or deployment', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(6);
    expect(stateData.phaseStatus).toBe('complete');
    expect(stateData.phase6).toMatchObject({
      merchantRecords: 9,
      approvedMerchants: 0,
      activeAffiliateLinks: 0,
      revenueModules: 7,
      activeRevenueModules: 0,
      reservedAdSlots: 4,
      activeAdSlots: 0,
      socialCalendarDays: 90,
      analyticsEvents: 18,
      collectionEnabled: false,
      totalStaticHtmlPages: 116,
      productionDeployment: false,
    });
    expect(stateData.editorialStatusCounts.published).toBe(0);
    expect(stateData.nextCommand).toMatch(/do not publish/i);
  });
});
