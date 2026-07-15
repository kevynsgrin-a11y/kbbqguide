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
const batchIds = [
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
] as const;
const batchIdSet = new Set<string>(batchIds);
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
const batchRecipes = completeRecipes.filter((recipe) =>
  batchIdSet.has(recipe.id),
);

describe('Phase 3 Batch 1 editorial handoff gate', () => {
  it('keeps all ten authorized Batch 1 records complete as later batches advance', () => {
    expect(recipes).toHaveLength(80);
    expect(batchRecipes.map((recipe) => recipe.id).sort()).toEqual(
      [...batchIds].sort(),
    );
    expect(
      recipes.filter((recipe) => recipe.contentStatus === 'stub'),
    ).toHaveLength(80 - completeRecipes.length);

    for (const recipe of batchRecipes) {
      expect(completeRecipeSchema.safeParse(recipe).success, recipe.id).toBe(
        true,
      );
    }
  });

  it('preserves every locked identity, release, URL, and relationship field', () => {
    for (const recipe of batchRecipes) {
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

  it('keeps every promoted record as an unpublished draft behind all human gates', () => {
    for (const recipe of batchRecipes) {
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

    const activeRecipeEntries = registryData.entries.filter(
      (entry) =>
        entry.type === 'recipe' && batchIdSet.has(entry.id) && entry.indexable,
    );
    expect(activeRecipeEntries).toEqual([]);
  });

  it('includes operational instructions, measurable ingredients, and explicit raw-contact controls', () => {
    for (const recipe of batchRecipes) {
      expect(recipe.ingredientGroups.length).toBeGreaterThan(0);
      expect(recipe.instructions.length).toBeGreaterThanOrEqual(5);
      expect(recipe.instructions.map((step) => step.step)).toEqual(
        Array.from(
          { length: recipe.instructions.length },
          (_, index) => index + 1,
        ),
      );
      expect(
        recipe.instructions.filter((step) => step.safetyNote !== null).length,
      ).toBeGreaterThanOrEqual(2);
      expect(recipe.foodSafetyNotes.length).toBeGreaterThanOrEqual(4);
      expect(recipe.equipment.join(' ')).toMatch(
        /outdoor grill|indoor electric/i,
      );
      expect(recipe.grillSetup).toMatch(/ventilat|outdoor|electric/i);
      expect(recipe.sourcesAndEditorialNotes.join(' ')).toMatch(/https:\/\//);
    }
  });

  it('applies the locked whole-beef temperature and rest rule to all seven meat drafts', () => {
    const meats = batchRecipes.filter(
      (recipe) => recipe.category === 'grilled-meat',
    );
    expect(meats).toHaveLength(7);

    for (const recipe of meats) {
      expect(recipe.marinadeOrSeasoning).not.toBeNull();
      expect(
        recipe.marinadeOrSeasoning?.reserveBeforeRawContactInstruction,
      ).toBeTruthy();
      expect(
        recipe.marinadeOrSeasoning?.rawContactDiscardOrReboilInstruction,
      ).toMatch(/discard|boil/i);
      expect(recipe.targetInternalTemperature).toMatch(/145°F \/ 63°C/i);
      expect(recipe.targetInternalTemperature).toMatch(/3-minute rest/i);
    }
  });

  it('includes the full preparation and official visual doneness framework for all three seafood drafts', () => {
    const seafood = batchRecipes.filter(
      (recipe) => recipe.category === 'seafood',
    );
    expect(seafood).toHaveLength(3);

    for (const recipe of seafood) {
      expect(recipe.seafoodPreparation).not.toBeNull();
      expect(recipe.seafoodPreparation?.buyingCues.length).toBeGreaterThan(0);
      expect(recipe.seafoodPreparation?.thawing).toBeTruthy();
      expect(
        recipe.seafoodPreparation?.cleaningOrShellPreparation,
      ).toBeTruthy();
      expect(recipe.seafoodPreparation?.drying).toBeTruthy();
      expect(recipe.seafoodPreparation?.stickingPrevention).toBeTruthy();
      expect(recipe.seafoodPreparation?.donenessCues.length).toBeGreaterThan(0);
      expect(recipe.targetInternalTemperature).toMatch(/FoodSafety\.gov/i);
      expect(recipe.targetInternalTemperature).toMatch(
        /opaque|milky white|pearly/i,
      );
    }
  });

  it('retains evidence that Batch 1 is complete as later batches advance', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData.contentStatusCounts.complete).toBeGreaterThanOrEqual(10);
    expect(stateData.phase3Batches.planned).toBe(8);
    expect(stateData.phase3Batches.completed).toBeGreaterThanOrEqual(1);
    expect(stateData.unresolvedCriticalErrors).toBe(0);
  });
});
