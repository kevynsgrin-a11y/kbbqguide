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
const priorIds = [
  'M01',
  'M02',
  'M03',
  'M04',
  'M05',
  'M06',
  'M07',
  'SF01',
  'SF02',
  'SF03',
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
const batch3Ids = [
  'F01',
  'F02',
  'F03',
  'SA01',
  'SA02',
  'SA03',
  'D01',
  'D02',
  'M08',
  'M09',
] as const;
const expectedBatch3CompleteIds = [...priorIds, ...batch3Ids];
const batch3IdSet = new Set<string>(batch3Ids);
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
const batch3Recipes = completeRecipes.filter((recipe) =>
  batch3IdSet.has(recipe.id),
);
const batch3ById = new Map(batch3Recipes.map((recipe) => [recipe.id, recipe]));

describe('Phase 3 Batch 3 editorial handoff gate', () => {
  it('keeps every recipe promoted through the authorized third batch complete', () => {
    expect(recipes).toHaveLength(80);
    expect(completeRecipes.map((recipe) => recipe.id)).toEqual(
      expect.arrayContaining(expectedBatch3CompleteIds),
    );
    expect(batch3Recipes.map((recipe) => recipe.id).sort()).toEqual(
      [...batch3Ids].sort(),
    );
    for (const recipe of completeRecipes) {
      expect(completeRecipeSchema.safeParse(recipe).success, recipe.id).toBe(
        true,
      );
    }
  });

  it('preserves every Batch 3 identity, release, URL, and relationship lock', () => {
    for (const recipe of batch3Recipes) {
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

  it('keeps Batch 3 unpublished, non-indexable, unmonetized, and behind all human gates', () => {
    for (const recipe of batch3Recipes) {
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
          batch3IdSet.has(entry.id) &&
          entry.indexable,
      ),
    ).toEqual([]);
  });

  it('includes measurable ingredients, sequential operational steps, safety notes, and unique SEO fields', () => {
    for (const recipe of batch3Recipes) {
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
    expect(new Set(batch3Recipes.map((recipe) => recipe.seoTitle)).size).toBe(
      10,
    );
    expect(
      new Set(batch3Recipes.map((recipe) => recipe.metaDescription)).size,
    ).toBe(10);
  });

  it('applies distinct ready-to-eat produce, sauce, raw-flour, ice, and choking controls', () => {
    for (const id of ['F01', 'F02', 'F03']) {
      const recipe = batch3ById.get(id);
      expect(recipe?.foodSafetyNotes.join(' ')).toMatch(
        /raw|produce|running water/i,
      );
      expect(recipe?.targetInternalTemperature).toBeNull();
      expect(recipe?.seafoodPreparation).toBeNull();
    }
    expect(batch3ById.get('F03')?.instructions.at(-1)?.action).toMatch(
      /immediately|at once/i,
    );

    for (const id of ['SA01', 'SA02', 'SA03']) {
      expect(batch3ById.get(id)?.foodSafetyNotes.join(' ')).toMatch(
        /individual|portion|utensil/i,
      );
    }
    expect(batch3ById.get('SA02')?.foodSafetyNotes.join(' ')).toMatch(
      /garlic/i,
    );
    expect(batch3ById.get('D01')?.foodSafetyNotes.join(' ')).toMatch(
      /raw flour|raw dough/i,
    );
    expect(batch3ById.get('D01')?.foodSafetyNotes.join(' ')).toMatch(
      /burn|molten/i,
    );
    expect(batch3ById.get('D02')?.foodSafetyNotes.join(' ')).toMatch(
      /potable/i,
    );
    expect(batch3ById.get('D02')?.foodSafetyNotes.join(' ')).toMatch(
      /choking/i,
    );
  });

  it('separates whole-cut and ground-meat temperature rules with full marinade controls', () => {
    const neobiani = batch3ById.get('M08');
    const tteokgalbi = batch3ById.get('M09');

    for (const recipe of [neobiani, tteokgalbi]) {
      expect(recipe?.marinadeOrSeasoning).not.toBeNull();
      expect(
        recipe?.marinadeOrSeasoning?.reserveBeforeRawContactInstruction,
      ).toBeTruthy();
      expect(
        recipe?.marinadeOrSeasoning?.rawContactDiscardOrReboilInstruction,
      ).toMatch(/discard/i);
      expect(recipe?.grillSetup).toMatch(/outdoor|electric/i);
    }

    expect(neobiani?.targetInternalTemperature).toMatch(/145°F \/ 63°C/i);
    expect(neobiani?.targetInternalTemperature).toMatch(/3-minute rest/i);
    expect(tteokgalbi?.targetInternalTemperature).toMatch(/160°F \/ 71°C/i);
    expect(tteokgalbi?.targetInternalTemperature).toMatch(/ground/i);
  });

  it('records a state at or beyond the completed Batch 3 checkpoint', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData.phase3Batches.planned).toBe(8);
    expect(stateData.phase3Batches.completed).toBeGreaterThanOrEqual(3);
    expect(stateData.contentStatusCounts.complete).toBeGreaterThanOrEqual(30);
    expect(stateData.unresolvedCriticalErrors).toBe(0);
  });
});
