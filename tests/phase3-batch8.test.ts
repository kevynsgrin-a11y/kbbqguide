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
const batch8Ids = [
  'B24',
  'D03',
  'M19',
  'SF15',
  'F09',
  'D04',
  'M20',
  'B25',
  'F10',
  'D05',
] as const;
const set = new Set<string>(batch8Ids);
const inventory = new Map(inventoryData.recipes.map((r) => [r.id, r]));
const graph = new Map(graphData.nodes.map((r) => [r.id, r]));
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
const batch8 = complete.filter((recipe) => set.has(recipe.id));
const byId = new Map(batch8.map((recipe) => [recipe.id, recipe]));

describe('Phase 3 Batch 8 and full-corpus closeout gate', () => {
  it('closes Phase 3 with eighty schema-valid complete drafts and zero stubs', () => {
    expect(recipes).toHaveLength(80);
    expect(complete).toHaveLength(80);
    expect(recipes.filter((r) => r.contentStatus === 'stub')).toHaveLength(0);
    expect(batch8.map((r) => r.id).sort()).toEqual([...batch8Ids].sort());
    for (const recipe of complete)
      expect(completeRecipeSchema.safeParse(recipe).success, recipe.id).toBe(
        true,
      );
  });

  it('preserves every final-batch identity, release, URL, and relationship lock', () => {
    for (const recipe of batch8) {
      const locked = inventory.get(recipe.id);
      const links = graph.get(recipe.id);
      expect(recipe).toMatchObject({
        id: locked?.id,
        title: locked?.title,
        category: locked?.category,
        canonicalSlug: locked?.slug,
        canonicalUrl: locked?.canonicalUrl,
        releaseCohort: locked?.releaseCohort,
        publicReleaseOrder: locked?.publicReleaseOrder,
        menuPairings: links?.menuPairings,
        relatedRecipeIds: links?.relatedRecipeIds,
      });
    }
  });

  it('keeps all eighty records unpublished, non-indexable, unmonetized, and behind human gates', () => {
    for (const recipe of complete) {
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
      expect(recipe.instructions.length).toBeGreaterThanOrEqual(6);
      expect(recipe.instructions.every((step) => step.safetyNote)).toBe(true);
      expect(recipe.sourcesAndEditorialNotes.join(' ')).toMatch(
        /not test-cooked|no .*test-cooked claim/i,
      );
    }
    expect(
      registryData.entries.filter(
        (entry) => entry.type === 'recipe' && entry.indexable,
      ),
    ).toEqual([]);
  });

  it('enforces conservative duck and whole-cut lamb endpoints with complete marinade controls', () => {
    const duck = byId.get('M19');
    const lamb = byId.get('M20');
    expect(duck?.targetInternalTemperature).toMatch(/165°F \/ 74°C/);
    expect(duck?.foodSafetyNotes.join(' ')).toMatch(/poultry|do not wash/i);
    expect(lamb?.targetInternalTemperature).toMatch(
      /145°F \/ 63°C.*3-minute rest/i,
    );
    expect(lamb?.foodSafetyNotes.join(' ')).toMatch(/whole-cut|3 minutes/i);
    for (const recipe of [duck, lamb]) {
      expect(recipe?.marinadeOrSeasoning).not.toBeNull();
      expect(
        recipe?.marinadeOrSeasoning?.reserveBeforeRawContactInstruction,
      ).toMatch(/before/i);
      expect(
        recipe?.marinadeOrSeasoning?.rawContactDiscardOrReboilInstruction,
      ).toMatch(/discard/i);
    }
  });

  it('enforces approved-source, live-shell, opening, discard, and cross-contact rules for clams', () => {
    const clams = byId.get('SF15');
    expect(clams?.seafoodPreparation).not.toBeNull();
    expect(clams?.seafoodPreparation?.buyingCues.join(' ')).toMatch(
      /tag|label|approved source/i,
    );
    expect(clams?.seafoodPreparation?.shellOpeningAndDiscardGuidance).toMatch(
      /discard every clam.*does not open/i,
    );
    expect(clams?.foodSafetyNotes.join(' ')).toMatch(/close when tapped/i);
    expect(clams?.seafoodPreparation?.crossContactNotes).toHaveLength(3);
  });

  it('applies refrigerator-pickle, produce, rapid-cooling, and packaged-seaweed controls', () => {
    const pickle = byId.get('B24');
    expect(pickle?.foodSafetyNotes.join(' ')).toMatch(
      /refrigerator pickle only.*not shelf-stable/i,
    );
    expect(pickle?.foodSafetyNotes.join(' ')).toMatch(/5% acidity/i);
    expect(byId.get('F09')?.foodSafetyNotes.join(' ')).toMatch(
      /running water.*do not use soap/i,
    );
    expect(byId.get('F10')?.foodSafetyNotes.join(' ')).toMatch(
      /potable ice and water|cool.*promptly/i,
    );
    expect(byId.get('B25')?.foodSafetyNotes.join(' ')).toMatch(
      /intact.*package|label cross-contact/i,
    );
  });

  it('covers raw-flour and hot-oil hazards, rice-cake choking, pasteurized ice cream, and cooked-rice cooling', () => {
    const yakgwa = byId.get('D03');
    const toast = byId.get('D04');
    const sikhye = byId.get('D05');
    expect(yakgwa?.foodSafetyNotes.join(' ')).toMatch(/raw flour|raw dough/i);
    expect(yakgwa?.foodSafetyNotes.join(' ')).toMatch(/hot oil|thermometer/i);
    expect(toast?.foodSafetyNotes.join(' ')).toMatch(/choking hazard/i);
    expect(toast?.foodSafetyNotes.join(' ')).toMatch(
      /commercial pasteurized ice cream/i,
    );
    expect(sikhye?.foodSafetyNotes.join(' ')).toMatch(
      /not an alcoholic fermentation/i,
    );
    expect(sikhye?.foodSafetyNotes.join(' ')).toMatch(
      /rolling boil|140 to 70°F.*2 hours|shallow containers/i,
    );
  });

  it('records Batch 8 and marks Phase 3 complete without authorizing publication', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData).toMatchObject({
      contentStatusCounts: { stub: 0, complete: 80 },
      editorialStatusCounts: { draft: 80, published: 0 },
      unresolvedCriticalErrors: 0,
    });
    expect(stateData.phase3Batches).toMatchObject({
      planned: 8,
      completed: 8,
      lastCompletedBatchRecipeIds: batch8Ids,
      nextBatchRecipeIds: [],
    });
    expect(stateData.nextCommand).toMatch(/do not publish/i);
  });
});
