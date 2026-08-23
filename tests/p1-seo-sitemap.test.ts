import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it, vi } from 'vitest';

import {
  approvedRecipeStructuredDataMedia,
  isApprovedRecipeStructuredDataMedia,
  type ResolvedMedia,
} from '../src/lib/media';
import {
  isActualPublicationDate,
  recipeSitemapLastModified,
} from '../src/lib/publication-governance';
import { recipeJsonLd } from '../src/lib/seo';
import { completeRecipeSchema } from '../src/schemas/recipe';

const root = resolve(import.meta.dirname, '..');
const draftSource = JSON.parse(
  readFileSync(resolve(root, 'src/content/recipes/b01.json'), 'utf8'),
);
const evidenceValidator = (args: readonly string[] = []) =>
  spawnSync(
    process.execPath,
    ['scripts/validate-publication-evidence.mjs', ...args],
    { cwd: root, encoding: 'utf8' },
  );

function draftRecipe() {
  return completeRecipeSchema.parse(JSON.parse(JSON.stringify(draftSource)));
}

function approvedGate(label: string) {
  return {
    status: 'approved' as const,
    reviewerName: `${label} Reviewer`,
    reviewerProfileUrl: `https://profiles.test/${label.toLowerCase().replaceAll(' ', '-')}`,
    reviewerRole: `${label} reviewer`,
    reviewerCredential:
      label === 'Food Safety' ? 'Test food-safety credential' : null,
    reviewedAt: '2026-08-20',
    evidence: `https://records.test/reviews/${label.toLowerCase().replaceAll(' ', '-')}`,
  };
}

function publishableRecipe() {
  const recipe = draftRecipe();
  recipe.editorialStatus = 'published';
  recipe.author = 'Test Author';
  recipe.authorProfileUrl = 'https://profiles.test/test-author';
  recipe.materiallyUpdatedAt = '2026-08-23';
  recipe.updatedAt = '2026-08-23';
  recipe.publishedAt = '2026-08-22';
  recipe.testCookStatus = 'approved';
  recipe.foodSafetyReview = 'approved';
  recipe.koreanLanguageReview = 'approved';
  recipe.editorialReviewStatus = 'approved';
  recipe.reviewGates = {
    testCook: approvedGate('Test Cook'),
    foodSafety: approvedGate('Food Safety'),
    koreanLanguage: approvedGate('Korean Language'),
    editorial: approvedGate('Editorial'),
  };
  return recipe;
}

describe('P1 sitemap, schema, and publication-evidence gates', () => {
  it('emits no Recipe JSON-LD for drafts or recipe records without approved public images', () => {
    const draft = draftRecipe();
    expect(recipeJsonLd(draft, '/recipes/banchan/baechu-kimchi/')).toBeNull();
    expect(
      recipeJsonLd(publishableRecipe(), '/recipes/banchan/baechu-kimchi/'),
    ).toBeNull();

    // The current campaign assets are truthfully labeled synthetic and still
    // awaiting human approval, so they cannot substantiate Recipe JSON-LD.
    expect(approvedRecipeStructuredDataMedia('B01', ['B01-hero'])).toEqual([]);
  });

  it('cannot be injected with an unrelated but syntactically valid HTTPS image URL', () => {
    const recipe = publishableRecipe();

    // Simulates a stale or hostile JavaScript caller passing the former third
    // argument at runtime. The public API deliberately takes two arguments and
    // resolves images from the recipe's own approved manifest evidence only.
    const data = Reflect.apply(recipeJsonLd, undefined, [
      recipe,
      '/recipes/banchan/baechu-kimchi/',
      ['https://unrelated.example/recipe.jpg'],
    ]);

    expect(recipeJsonLd).toHaveLength(2);
    expect(data).toBeNull();
  });

  it('rejects a licensed nonhero candidate until it carries a nonempty license record', () => {
    const licensedCandidate = {
      assetId: 'B01-secondary',
      role: 'finished-dish-hero',
      assetStatus: 'licensed-approved',
      status: undefined,
      provenance: { sourceRecord: 'B01' },
      rights: { externalLicense: null },
      altDecision: 'informative',
      altText:
        'A reviewed secondary recipe image used for license-gate testing.',
      humanEditorialReview: { status: 'approved' },
    } as unknown as ResolvedMedia;

    expect(isApprovedRecipeStructuredDataMedia(licensedCandidate, 'B01')).toBe(
      false,
    );

    licensedCandidate.rights.externalLicense = '{{LICENSE_RECORD}}';
    expect(isApprovedRecipeStructuredDataMedia(licensedCandidate, 'B01')).toBe(
      false,
    );

    licensedCandidate.rights.externalLicense =
      'https://licenses.test/b01-secondary';
    expect(isApprovedRecipeStructuredDataMedia(licensedCandidate, 'B01')).toBe(
      true,
    );
  });

  it('enriches a fully attributable recipe only when the internal derivative gate supplies all three first-party images', async () => {
    const recipe = publishableRecipe();
    const approvedImageSet = {
      urls: [
        'https://kbbqguide.com/_astro/b01-approved-1200x1200.jpg',
        'https://kbbqguide.com/_astro/b01-approved-1200x900.jpg',
        'https://kbbqguide.com/_astro/b01-approved-1200x675.jpg',
      ],
    };

    vi.resetModules();
    vi.doMock('../src/lib/recipe-structured-data-images', () => ({
      isApprovedRecipeStructuredDataImageSet: (
        value: unknown,
        recipeId: string,
      ) => value === approvedImageSet && recipeId === recipe.id,
    }));

    const { recipeJsonLd: recipeJsonLdWithApprovedMedia } =
      await import('../src/lib/seo');
    const data = recipeJsonLdWithApprovedMedia(
      recipe,
      '/recipes/banchan/baechu-kimchi/',
      approvedImageSet as never,
    );

    expect(data).not.toBeNull();
    if (data === null) return;
    expect(data).toMatchObject({
      '@type': 'Recipe',
      image: approvedImageSet.urls,
      author: {
        '@type': 'Person',
        name: 'Test Author',
        url: 'https://profiles.test/test-author',
      },
      datePublished: '2026-08-22',
      dateModified: '2026-08-23',
      recipeCuisine: 'Korean',
      recipeCategory: 'Banchan',
    });
    expect(data.keywords).toContain(recipe.primaryKeyword);
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('review');
    expect(data).not.toHaveProperty('nutrition');

    vi.doUnmock('../src/lib/recipe-structured-data-images');
    vi.resetModules();
  });

  it('derives sitemap lastmod from real public dates and rejects malformed dates', () => {
    const published = publishableRecipe();

    expect(isActualPublicationDate('2026-02-29')).toBe(false);
    expect(isActualPublicationDate('2028-02-29')).toBe(true);
    expect(recipeSitemapLastModified(draftRecipe())).toBeNull();
    expect(recipeSitemapLastModified(published)).toBe('2026-08-23');
  });

  it('wires raw content/evidence QA and `<lastmod>` into the production build path', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8'),
    );
    const sitemap = readFileSync(
      resolve(root, 'src/pages/sitemap.xml.ts'),
      'utf8',
    );

    expect(
      existsSync(resolve(root, 'scripts/validate-publication-evidence.mjs')),
    ).toBe(true);
    expect(packageJson.scripts.build).toContain(
      'validate:publication-evidence',
    );
    expect(sitemap).toContain('recipeSitemapLastModified');
    expect(sitemap).toContain('<lastmod>');
  });

  it('fails release-only metadata, content-consistency, relationship, and allergen defects while retaining heuristic findings as warnings', () => {
    const result = evidenceValidator([
      '--recipes-dir',
      'tests/fixtures/publication-evidence/recipes',
      '--media-manifest',
      'tests/fixtures/publication-evidence/media-manifest.json',
    ]);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('totalTime.minutes (99)');
    expect(output).toContain('allergens.soy must be true');
    expect(output).toContain('references unknown recipe ID MISSING');
    expect(output).toContain('must not reference the recipe itself (P02)');
    expect(output).toContain('Duplicate public page title');
    expect(output).toContain('Duplicate public meta description');
    expect(output).toContain('Duplicate public canonical URL');
    expect(output).toContain('Duplicate public H1');
    expect(output).toContain('Duplicate public social image');
    expect(output).toContain('P01-secondary needs a license record');
    expect(output).toContain('ingredient↔instruction trace warning');
    expect(output).toContain('temperature source-linkage warning');
    expect(output).toContain('storage source-linkage warning');
    expect(output).toContain('semantic-similarity warning');
    expect(output).toContain('limitations');
  });

  it('keeps the real draft collection release-safe while surfacing schema limitations explicitly', () => {
    const result = evidenceValidator();
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('publication-evidence — clean.');
    expect(output).toContain('"limitations"');
  });
});
