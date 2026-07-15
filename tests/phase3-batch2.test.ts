import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import graphData from '../data/recipe-relationship-graph.json';
import inventoryData from '../data/recipe-inventory.json';
import registryData from '../data/url-registry.json';
import stateData from '../project-state.json';
import {
  completeRecipeSchema,
  recipeSchema,
  type CompleteRecipe,
  type Recipe,
} from '../src/schemas/recipe';

const root = resolve(import.meta.dirname, '..');
const batch2Ids = [
  'SF04',
  'B01',
  'B02',
  'B03',
  'B04',
  'B05',
  'B06',
  'B07',
  'B08',
  'B09',
] as const;
const batch2IdSet = new Set<string>(batch2Ids);
const inventoryById = new Map(
  inventoryData.recipes.map((recipe) => [recipe.id, recipe]),
);
const graphById = new Map(graphData.nodes.map((node) => [node.id, node]));

function readRecipes(): Recipe[] {
  return readdirSync(resolve(root, 'src/content/recipes'))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const raw: unknown = JSON.parse(
        readFileSync(resolve(root, 'src/content/recipes', file), 'utf8'),
      );
      const parsed = recipeSchema.safeParse(raw);
      expect(parsed.success, file).toBe(true);
      if (!parsed.success) throw new Error(parsed.error.message);
      return parsed.data;
    });
}

const recipes = readRecipes();
const completeRecipes = recipes.filter(
  (recipe): recipe is CompleteRecipe => recipe.contentStatus === 'complete',
);
const batch2Recipes = completeRecipes.filter((recipe) =>
  batch2IdSet.has(recipe.id),
);
const batch2ById = new Map(batch2Recipes.map((recipe) => [recipe.id, recipe]));

describe('Phase 3 Batch 2 editorial handoff gate', () => {
  it('keeps all ten authorized Batch 2 records complete as later batches advance', () => {
    expect(recipes).toHaveLength(80);
    expect(batch2Recipes.map((recipe) => recipe.id).sort()).toEqual(
      [...batch2Ids].sort(),
    );
    expect(
      recipes.filter((recipe) => recipe.contentStatus === 'stub'),
    ).toHaveLength(80 - completeRecipes.length);
    for (const recipe of completeRecipes) {
      expect(completeRecipeSchema.safeParse(recipe).success, recipe.id).toBe(
        true,
      );
    }
  });

  it('preserves every Batch 2 identity, release, URL, and relationship lock', () => {
    for (const recipe of batch2Recipes) {
      const locked = inventoryById.get(recipe.id);
      const graphNode = graphById.get(recipe.id);
      expect(locked, recipe.id).toBeDefined();
      expect(graphNode, recipe.id).toBeDefined();
      expect(recipe).toMatchObject({
        id: locked?.id,
        title: locked?.title,
        category: locked?.category,
        canonicalSlug: locked?.slug,
        canonicalUrl: locked?.canonicalUrl,
        releaseCohort: locked?.releaseCohort,
        publicReleaseOrder: locked?.publicReleaseOrder,
        menuPairings: graphNode?.menuPairings,
        relatedRecipeIds: graphNode?.relatedRecipeIds,
      });
    }
  });

  it('keeps every Batch 2 record unpublished and behind all four human gates', () => {
    for (const recipe of batch2Recipes) {
      expect(recipe.editorialStatus).toBe('draft');
      expect(recipe.testCookStatus).toBe('required');
      expect(recipe.foodSafetyReview).toBe('required');
      expect(recipe.koreanLanguageReview).toBe('required');
      expect(recipe.reviewer).toBeNull();
      expect(recipe.publishedAt).toBeNull();
      expect(recipe.nutritionStatus).toBe('not-calculated');
      expect(recipe.imageManifestIds).toEqual([]);
      expect(recipe.videoManifestId).toBeNull();
      expect(recipe.transcriptId).toBeNull();
      expect(recipe.affiliateModuleIds).toEqual([]);
      expect(recipe.sourcesAndEditorialNotes.join(' ')).toMatch(/test-cook/i);
    }

    expect(
      registryData.entries.filter(
        (entry) =>
          entry.type === 'recipe' &&
          batch2IdSet.has(entry.id) &&
          entry.indexable,
      ),
    ).toEqual([]);
  });

  it('includes measurable ingredients, sequential instructions, safety notes, and unique SEO fields', () => {
    for (const recipe of batch2Recipes) {
      expect(recipe.ingredientGroups.length).toBeGreaterThan(0);
      expect(recipe.instructions.length).toBeGreaterThanOrEqual(6);
      expect(recipe.instructions.map((step) => step.step)).toEqual(
        Array.from(
          { length: recipe.instructions.length },
          (_, index) => index + 1,
        ),
      );
      expect(
        recipe.instructions.filter((step) => step.safetyNote !== null).length,
      ).toBe(recipe.instructions.length);
      expect(recipe.foodSafetyNotes.length).toBeGreaterThanOrEqual(5);
      expect(recipe.sourcesAndEditorialNotes.join(' ')).toMatch(/https:\/\//);
    }
    expect(new Set(batch2Recipes.map((recipe) => recipe.seoTitle)).size).toBe(
      10,
    );
    expect(
      new Set(batch2Recipes.map((recipe) => recipe.metaDescription)).size,
    ).toBe(10);
  });

  it('provides a complete whole-squid handling and official visual doneness block', () => {
    const squid = batch2ById.get('SF04');
    expect(squid?.category).toBe('seafood');
    expect(squid?.seafoodPreparation).not.toBeNull();
    expect(squid?.seafoodPreparation?.buyingCues.length).toBeGreaterThan(1);
    expect(squid?.seafoodPreparation?.thawing).toMatch(/refrigerator/i);
    expect(squid?.seafoodPreparation?.cleaningOrShellPreparation).toMatch(
      /quill|beak/i,
    );
    expect(squid?.seafoodPreparation?.drying).toBeTruthy();
    expect(squid?.seafoodPreparation?.stickingPrevention).toBeTruthy();
    expect(squid?.targetInternalTemperature).toMatch(/FoodSafety\.gov/i);
    expect(squid?.targetInternalTemperature).toMatch(/opaque/i);
    expect(squid?.grillSetup).toMatch(/outdoor|electric/i);
  });

  it('distinguishes fermented, fresh, sprout, blanched, raw-salad, and braised banchan controls', () => {
    for (const id of ['B01', 'B02']) {
      const recipe = batch2ById.get(id);
      expect(recipe?.instructions.map((step) => step.action).join(' ')).toMatch(
        /headspace/i,
      );
      expect(recipe?.foodSafetyNotes.join(' ')).toMatch(/mold/i);
      expect(recipe?.foodSafetyNotes.join(' ')).toMatch(/40°F \/ 4°C/i);
    }

    expect(
      batch2ById
        .get('B03')
        ?.instructions.map((step) => step.action)
        .join(' '),
    ).toMatch(/refrigerate immediately/i);
    expect(batch2ById.get('B04')?.foodSafetyNotes.join(' ')).toMatch(
      /do not hold at room temperature to ferment/i,
    );
    expect(batch2ById.get('B05')?.foodSafetyNotes.join(' ')).toMatch(
      /do not.*raw/i,
    );
    expect(
      batch2ById
        .get('B06')
        ?.instructions.map((step) => step.action)
        .join(' '),
    ).toMatch(/blanch/i);
    expect(batch2ById.get('B07')?.storage).toMatch(/2 days/i);
    expect(batch2ById.get('B08')?.grillSetup).toMatch(/not applicable/i);
    expect(
      batch2ById
        .get('B09')
        ?.instructions.map((step) => step.action)
        .join(' '),
    ).toMatch(/knife enters|glaze/i);
  });

  it('retains evidence that Batch 2 is complete as later batches advance', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData.contentStatusCounts.complete).toBeGreaterThanOrEqual(20);
    expect(stateData.phase3Batches.planned).toBe(8);
    expect(stateData.phase3Batches.completed).toBeGreaterThanOrEqual(2);
    expect(stateData.unresolvedCriticalErrors).toBe(0);
  });
});
