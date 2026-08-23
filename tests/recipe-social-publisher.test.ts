import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { approvedPrivacyNoticeOrNull } from '../src/lib/privacy-notice';
import {
  publisherWebSiteJsonLd,
  publisherWebSiteJsonLdFrom,
} from '../src/lib/publisher-schema';
import {
  recipeSocialCardEligible,
  recipeSocialImageHeight,
  recipeSocialImageWidth,
  type RecipeSocialMediaCandidate,
} from '../src/lib/recipe-social-gate';

const root = resolve(import.meta.dirname, '..');

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

const socialLicensedMedia: RecipeSocialMediaCandidate = {
  rights: {
    source: 'first-party original',
    scope: 'KBBQGuide site, social preview, and editorial promotion',
    externalLicense: null,
  },
};

describe('P1 #8 — recipe social cards', () => {
  it('keeps draft and unlicensed recipe cards out of public social metadata', () => {
    expect(recipeSocialCardEligible(false, socialLicensedMedia)).toBe(false);
    expect(recipeSocialCardEligible(true, null)).toBe(false);
    expect(
      recipeSocialCardEligible(true, {
        rights: {
          source: 'first-party original',
          scope: 'KBBQGuide site editorial use only',
          externalLicense: null,
        },
      }),
    ).toBe(false);
    expect(recipeSocialCardEligible(true, socialLicensedMedia)).toBe(true);
  });

  it('uses a fixed, broadly supported card size when a card is eligible', () => {
    expect(recipeSocialImageWidth).toBe(1200);
    expect(recipeSocialImageHeight).toBe(630);

    const social = source('src/lib/recipe-social.ts');
    expect(social).toContain('approvedRecipeStructuredDataMedia');
    expect(social).toContain("format: 'jpg'");
    expect(social).toContain('position: media.focalPoint');
  });

  it('wires article semantics and image metadata only from the public-card gate', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const recipePage = source('src/components/RecipePage.astro');

    expect(layout).toContain('const socialOpenGraphType');
    expect(layout).toContain(
      "openGraphType === 'article' ? 'article' : 'website'",
    );
    expect(layout).toContain('socialImageUrl && socialImageAlt');
    expect(recipePage).toContain('canEmitPublicRecipeMetadata');
    expect(recipePage).toContain('resolveRecipeSocialCard(');
    expect(recipePage).toContain("openGraphType: 'article' as const");
    expect(recipePage).toContain('{...socialCardProps}');
  });
});

describe('P1 #9 — publisher and WebSite structured data', () => {
  it('does not infer an organization while the factual privacy notice is blocked', () => {
    expect(approvedPrivacyNoticeOrNull()).toBeNull();
    expect(publisherWebSiteJsonLd()).toBeNull();
  });

  it('emits only a minimal factual graph from an approved operator record', () => {
    const graph = publisherWebSiteJsonLdFrom({
      legalOperatorName: 'Verified Operator LLC',
    });

    expect(graph).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://kbbqguide.com/#organization',
          name: 'Verified Operator LLC',
          url: 'https://kbbqguide.com/',
        },
        {
          '@type': 'WebSite',
          '@id': 'https://kbbqguide.com/#website',
          name: 'KBBQGuide',
          url: 'https://kbbqguide.com/',
          inLanguage: 'en',
          publisher: { '@id': 'https://kbbqguide.com/#organization' },
        },
      ],
    });
    expect(graph?.['@graph'][0]).not.toHaveProperty('logo');
    expect(graph?.['@graph'][0]).not.toHaveProperty('email');
    expect(graph?.['@graph'][0]).not.toHaveProperty('address');
  });

  it('adds the graph to the index only through the privacy-gated helper', () => {
    const home = source('src/pages/index.astro');
    expect(home).toContain('publisherWebSiteJsonLd');
    expect(home).toContain('publisherWebsiteGraph === null');
    expect(home).toContain('jsonLd={structuredData}');
  });
});
