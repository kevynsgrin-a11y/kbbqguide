import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import inventoryData from '../data/recipe-inventory.json';
import mediaData from '../data/media-manifest.json';
import registryData from '../data/url-registry.json';
import stateData from '../project-state.json';
import { recipeSchema, type CompleteRecipe } from '../src/schemas/recipe';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');
const recipes = readdirSync(resolve(root, 'src/content/recipes'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => {
    const parsed = recipeSchema.parse(
      JSON.parse(source(`src/content/recipes/${file}`)),
    );
    if (parsed.contentStatus !== 'complete')
      throw new Error(`Phase 4 cannot render stub ${parsed.id}`);
    return parsed as CompleteRecipe;
  });

describe('Phase 4 UI, media, motion, and preview handoff gate', () => {
  it('routes all eighty complete records through one shared recipe template and six category configurations', () => {
    expect(recipes).toHaveLength(80);
    expect(new Set(recipes.map((recipe) => recipe.canonicalSlug)).size).toBe(
      80,
    );
    expect(source('src/pages/recipes/[category]/[slug].astro')).toMatch(
      /<RecipePage \{recipe\} \{related\}/,
    );
    expect(source('src/pages/recipes/[category]/[slug].astro')).toMatch(
      /getCollection\('recipes'\)/,
    );
    expect(source('src/lib/categories.ts').match(/id: 'CAT_/g)).toHaveLength(6);
    expect(inventoryData.total).toBe(80);
  });

  it('renders category-specific meat and seafood sections without hand-coded recipe layouts', () => {
    const template = source('src/components/RecipePage.astro');
    expect(template).toContain('recipe.marinadeOrSeasoning');
    expect(template).toContain('Marinade and seasoning controls');
    expect(template).toContain('recipe.seafoodPreparation');
    expect(template).toContain('Seafood handling');
    expect(template).toContain('recipe.instructions.map');
    expect(template).toContain('recipe.ingredientGroups.map');
    expect(readdirSync(resolve(root, 'src/pages/recipes'))).not.toHaveLength(
      80,
    );
  });

  it('keeps every preview page non-indexed and constructs live internal links from registry IDs', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const home = source('src/pages/index.astro');
    const category = source('src/pages/recipes/[category]/index.astro');
    const route = source('src/pages/recipes/[category]/[slug].astro');
    expect(layout).toContain('noindex,nofollow,noarchive');
    expect(layout).toContain('KBBQGuide editorial preview');
    for (const file of [home, category, route])
      expect(file).toContain('registryPathById');
    expect(
      registryData.entries.filter((entry) => entry.type === 'recipe'),
    ).toHaveLength(80);
    expect(
      registryData.entries.filter(
        (entry) => entry.type === 'recipe' && entry.indexable,
      ),
    ).toEqual([]);
  });

  it('provides semantic, keyboard, no-JavaScript, reduced-motion, and print contracts', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const header = source('src/components/Header.astro');
    const controls = source('src/components/RecipeControls.astro');
    const css = source('src/styles/global.css');
    expect(layout).toMatch(/skip-link.*#main-content/s);
    expect(layout).toMatch(/<main id="main-content"/);
    expect(header).toContain("event.key === 'Escape'");
    expect(header).toContain('.focus()');
    expect(controls).toContain('<noscript>');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media print');
    expect(css).toMatch(/\.safety-callout/);
    expect(css).toMatch(/min-width: 20rem/);
  });

  it('preserves the Phase 4 shot plan while activating audited Phase 9 recipe heroes', () => {
    expect(mediaData.version).toBe(4);
    expect(mediaData.phase).toBe(9);
    expect(mediaData.assets).toHaveLength(115);
    expect(mediaData.recipePlans).toHaveLength(80);
    expect(mediaData.responsiveImageContract.requiredAspectRatios).toEqual([
      '3:2',
      '16:9',
      '4:3',
      '1:1',
    ]);
    expect(mediaData.videoContract).toMatchObject({
      autoplayWithSound: false,
      captionsRequired: true,
      transcriptRequired: true,
      posterRequired: true,
      schemaOnlyWhenRealAssetExists: true,
    });
    for (const plan of mediaData.recipePlans) {
      expect(plan.hero).toMatchObject({
        assetId: `${plan.recipeId}-hero`,
        assetStatus: 'synthetic-labeled',
        width: 2400,
        height: 1600,
        loading: 'priority-on-detail-lazy-elsewhere',
      });
      expect(plan.hero.altText).toContain(plan.title);
      expect(plan.hero.caption).toContain(plan.title);
      expect(plan.stillShots.finishedDishOverhead.assetStatus).toBe(
        'placeholder',
      );
      expect(plan.stillShots.ingredientLayout.assetStatus).toBe('placeholder');
      expect(plan.stillShots.criticalSteps.length).toBeGreaterThanOrEqual(3);
      expect(plan.stillShots.criticalSteps.length).toBeLessThanOrEqual(6);
      expect(plan.stillShots.grillAction.assetStatus).toBe('placeholder');
      expect(plan.stillShots.servingTable.assetStatus).toBe('placeholder');
      expect(plan.videoPlans.longForm).toMatchObject({
        assetStatus: 'placeholder',
        aspectRatio: '16:9',
        captionsRequired: true,
        transcriptRequired: true,
      });
      expect(plan.videoPlans.shortForm.aspectRatio).toBe('9:16');
      expect(plan.videoPlans.longForm.posterFrameId).toBeTruthy();
      expect(plan.videoPlans.shortForm.posterFrameId).toBeTruthy();
      expect(plan.transcriptRequired).toBe(true);
      expect(plan.provenance).toMatch(/synthetic-labeled/i);
      expect(plan.rightsStatus).toMatch(/hero-cleared/i);
    }
  });

  it('provides one auditable media-production CSV row per locked recipe', () => {
    const rows = source('docs/media-production-plan.csv').trim().split('\n');
    expect(rows).toHaveLength(81);
    expect(rows[0]).toContain('critical_step_ids');
    expect(rows[0]).toContain('long_video_shot_list');
    expect(rows[0]).toContain('transcript_required');
    for (const recipe of recipes)
      expect(rows.some((row) => row.startsWith(`"${recipe.id}",`))).toBe(true);
  });

  it('resolves approved still media while retaining honest video placeholders', () => {
    const media = source('src/components/MediaPlaceholder.astro');
    const video = source('src/components/VideoPlaceholder.astro');
    expect(media).toContain('data-asset-status="placeholder"');
    expect(media).toContain('ResponsiveMedia');
    expect(media).toContain('Photography in production');
    expect(video).toContain('video is not yet produced');
    expect(video).not.toMatch(/<video\b/i);
    expect(video).toContain(
      'No video player, duration, upload date, or VideoObject is',
    );
  });

  it('records an 88-page Phase 4 implementation checkpoint and authorizes only Phase 5 next', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(4);
    expect(stateData).toMatchObject({
      phaseStatus: 'complete',
      contentStatusCounts: { complete: 80, stub: 0 },
      editorialStatusCounts: { draft: 80, published: 0 },
      unresolvedCriticalErrors: 0,
    });
    expect(stateData.phase4).toMatchObject({
      sharedRecipeTemplate: true,
      generatedRecipePages: 80,
      generatedCategoryPages: 6,
      totalStaticPages: 88,
      mediaPlans: 80,
      actualMediaAssets: 0,
      productionDeployment: false,
    });
    expect(stateData.nextCommand).toMatch(/do not publish/i);
  });
});
