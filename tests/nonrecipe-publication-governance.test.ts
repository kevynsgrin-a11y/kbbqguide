import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { guides, guidesIndexPublication } from '../src/lib/guides';
import {
  createDraftNonRecipePublication,
  isNonRecipePublishable,
  nonRecipePageEligibility,
  nonRecipePublicationEligibility,
  planningToolsPublication,
  relatedRecipeDataEligibility,
  type NonRecipePublication,
} from '../src/lib/nonrecipe-publication-governance';
import { menus, menusIndexPublication } from '../src/lib/menus';
import { resolveReleaseState } from '../src/lib/release-state';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

function approvedGate(label: string) {
  return {
    status: 'approved' as const,
    reviewerName: `${label} Reviewer`,
    reviewerProfileUrl: `https://profiles.test/${label.toLowerCase().replaceAll(' ', '-')}`,
    reviewerRole: `${label} reviewer`,
    reviewerCredential:
      label === 'Food Safety' ? 'Test food-safety credential' : null,
    reviewedAt: '2026-08-20',
    evidence: `docs/review-records/${label.toLowerCase().replaceAll(' ', '-')}.md`,
  };
}

function publishableNonRecipe(): NonRecipePublication {
  return {
    editorialStatus: 'published',
    author: 'Test Author',
    authorProfileUrl: 'https://profiles.test/test-author',
    materiallyUpdatedAt: '2026-08-21',
    publishedAt: '2026-08-22',
    reviewGates: {
      testCook: approvedGate('Test Cook'),
      foodSafety: approvedGate('Food Safety'),
      koreanLanguage: approvedGate('Korean Language'),
      editorial: approvedGate('Editorial'),
    },
  };
}

const publicLaunch = resolveReleaseState({
  mode: 'public-launch',
  publicReleaseApproved: 'approved',
  indexingApproved: 'approved',
});

describe('non-recipe publication governance', () => {
  it('marks all inherited guide, menu, and tool records as explicit drafts without invented reviewer facts', () => {
    const records = [
      ...guides.map((guide) => guide.publication),
      ...menus.map((menu) => menu.publication),
      guidesIndexPublication,
      menusIndexPublication,
      planningToolsPublication,
    ];

    expect(records).toHaveLength(18);
    for (const publication of records) {
      expect(publication.editorialStatus).toBe('draft');
      expect(publication.author).toBeNull();
      expect(publication.authorProfileUrl).toBeNull();
      expect(publication.materiallyUpdatedAt).toBeNull();
      expect(publication.publishedAt).toBeNull();
      expect(isNonRecipePublishable(publication)).toBe(false);
      expect(nonRecipePublicationEligibility(publication).blockers).toEqual(
        expect.arrayContaining([
          'publication status is not published',
          'named author is missing or unresolved',
          'foodSafety human-review evidence is incomplete',
        ]),
      );
    }
  });

  it('keeps unapproved non-recipe pages noindex and JSON-LD-free even after site launch approval', () => {
    const decision = nonRecipePageEligibility(
      createDraftNonRecipePublication(),
      publicLaunch,
    );

    expect(decision).toMatchObject({
      isContentPublishable: false,
      isIndexable: false,
      emitsJsonLd: false,
      robotsContent: 'noindex,nofollow,noarchive',
    });
  });

  it('only makes a fully named and evidenced non-recipe record indexable after public launch approval', () => {
    const publication = publishableNonRecipe();
    const decision = nonRecipePageEligibility(publication, publicLaunch);

    expect(isNonRecipePublishable(publication)).toBe(true);
    expect(decision).toMatchObject({
      isContentPublishable: true,
      isIndexable: true,
      emitsJsonLd: true,
      robotsContent: 'index,follow',
    });
  });

  it('withholds menu and tool recipe data in public launch until every represented recipe is published', () => {
    const preview = resolveReleaseState();
    const publication = publishableNonRecipe();

    expect(
      relatedRecipeDataEligibility(publication, publicLaunch, false),
    ).toMatchObject({
      isIndexable: false,
      emitsJsonLd: false,
      canExposeRecipeData: false,
      robotsContent: 'noindex,nofollow,noarchive',
    });
    expect(
      relatedRecipeDataEligibility(publication, publicLaunch, true),
    ).toMatchObject({
      isIndexable: true,
      emitsJsonLd: true,
      canExposeRecipeData: true,
      robotsContent: 'index,follow',
    });
    expect(
      relatedRecipeDataEligibility(
        createDraftNonRecipePublication(),
        preview,
        false,
      ),
    ).toMatchObject({
      isIndexable: false,
      emitsJsonLd: false,
      canExposeRecipeData: true,
      robotsContent: 'noindex,nofollow,noarchive',
    });
  });

  it('wires the same release predicate into every guide, menu, and tool surface', () => {
    expect(source('src/components/GuidePage.astro')).toContain(
      'nonRecipePageEligibility',
    );
    expect(source('src/pages/guides/index.astro')).toContain(
      'isNonRecipePublishable',
    );
    expect(source('src/pages/menus/index.astro')).toContain(
      'isRecipePublishable',
    );
    expect(source('src/pages/menus/[guests].astro')).toContain(
      'relatedRecipeDataEligibility',
    );
    expect(source('src/pages/tools/index.astro')).toContain(
      'canExposeRecipeData',
    );
  });
});
