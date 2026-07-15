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
const batch4Ids = [
  'B10',
  'SA04',
  'M10',
  'M11',
  'B11',
  'B12',
  'M12',
  'M13',
  'B13',
  'F04',
] as const;
const batch4Set = new Set<string>(batch4Ids);
const inventoryById = new Map(
  inventoryData.recipes.map((recipe) => [recipe.id, recipe]),
);
const graphById = new Map(graphData.nodes.map((node) => [node.id, node]));

const recipes: Recipe[] = readdirSync(resolve(root, 'src/content/recipes'))
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => {
    const parsed = recipeSchema.safeParse(
      JSON.parse(
        readFileSync(resolve(root, 'src/content/recipes', file), 'utf8'),
      ),
    );
    expect(parsed.success, file).toBe(true);
    if (!parsed.success) throw new Error(parsed.error.message);
    return parsed.data;
  });
const complete = recipes.filter(
  (recipe): recipe is CompleteRecipe => recipe.contentStatus === 'complete',
);
const batch4 = complete.filter((recipe) => batch4Set.has(recipe.id));
const byId = new Map(batch4.map((recipe) => [recipe.id, recipe]));

describe('Phase 3 Batch 4 editorial handoff gate', () => {
  it('keeps all ten authorized Batch 4 records complete in later checkpoints', () => {
    expect(recipes).toHaveLength(80);
    expect(complete.length).toBeGreaterThanOrEqual(40);
    expect(batch4.map((recipe) => recipe.id).sort()).toEqual(
      [...batch4Ids].sort(),
    );
    for (const recipe of complete)
      expect(completeRecipeSchema.safeParse(recipe).success, recipe.id).toBe(
        true,
      );
  });

  it('preserves every locked identity, release, URL, and relationship field', () => {
    for (const recipe of batch4) {
      const locked = inventoryById.get(recipe.id);
      const graph = graphById.get(recipe.id);
      expect(recipe).toMatchObject({
        id: locked?.id,
        title: locked?.title,
        category: locked?.category,
        canonicalSlug: locked?.slug,
        canonicalUrl: locked?.canonicalUrl,
        releaseCohort: locked?.releaseCohort,
        publicReleaseOrder: locked?.publicReleaseOrder,
        menuPairings: graph?.menuPairings,
        relatedRecipeIds: graph?.relatedRecipeIds,
      });
    }
  });

  it('keeps all records unpublished, non-indexable, unmonetized, and behind human gates', () => {
    for (const recipe of batch4) {
      expect(recipe).toMatchObject({
        editorialStatus: 'draft',
        testCookStatus: 'required',
        foodSafetyReview: 'required',
        koreanLanguageReview: 'required',
        reviewer: null,
        publishedAt: null,
        nutritionStatus: 'not-calculated',
        imageManifestIds: [],
        affiliateModuleIds: [],
      });
      expect(recipe.sourcesAndEditorialNotes.join(' ')).toMatch(
        /not test-cooked/i,
      );
      expect(recipe.instructions).toHaveLength(6);
      expect(recipe.instructions.every((step) => step.safetyNote)).toBe(true);
    }
    expect(
      registryData.entries.filter(
        (entry) =>
          entry.type === 'recipe' && batch4Set.has(entry.id) && entry.indexable,
      ),
    ).toEqual([]);
  });

  it('applies whole-cut pork controls and complete grilling preparations', () => {
    for (const id of ['M10', 'M11', 'M12', 'M13']) {
      const recipe = byId.get(id);
      expect(recipe?.marinadeOrSeasoning).not.toBeNull();
      expect(recipe?.targetInternalTemperature).toMatch(/145°F \/ 63°C/i);
      expect(recipe?.targetInternalTemperature).toMatch(/3-minute rest/i);
      expect(recipe?.grillSetup).toMatch(/outdoor|electric/i);
      expect(
        recipe?.marinadeOrSeasoning?.reserveBeforeRawContactInstruction,
      ).toBeTruthy();
      expect(
        recipe?.marinadeOrSeasoning?.rawContactDiscardOrReboilInstruction,
      ).toMatch(/discard/i);
    }
    expect(byId.get('M10')?.marinadeOrSeasoning?.type).toBe(
      'paired-grilling-preparation',
    );
  });

  it('applies dish-specific tofu, egg, fish-cake, sauce, and fresh-produce controls', () => {
    expect(byId.get('B10')?.foodSafetyNotes.join(' ')).toMatch(
      /hot oil|splatter/i,
    );
    expect(byId.get('SA04')?.foodSafetyNotes.join(' ')).toMatch(
      /individual|contaminated/i,
    );
    for (const id of ['B11', 'B12'])
      expect(byId.get(id)?.targetInternalTemperature).toMatch(/160°F \/ 71°C/i);
    expect(byId.get('B13')?.foodSafetyNotes.join(' ')).toMatch(
      /label|allergen/i,
    );
    expect(byId.get('B13')?.targetInternalTemperature).toMatch(/steaming/i);
    expect(byId.get('F04')?.foodSafetyNotes.join(' ')).toMatch(
      /running water/i,
    );
    expect(byId.get('F04')?.foodSafetyNotes.join(' ')).toMatch(/refrigerated/i);
  });

  it('records a state at or beyond the completed Batch 4 checkpoint', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData.phase3Batches.planned).toBe(8);
    expect(stateData.phase3Batches.completed).toBeGreaterThanOrEqual(4);
    expect(stateData.contentStatusCounts.complete).toBeGreaterThanOrEqual(40);
    expect(stateData.unresolvedCriticalErrors).toBe(0);
  });
});
