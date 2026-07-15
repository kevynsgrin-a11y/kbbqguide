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
const batch7Ids = [
  'SF12',
  'B21',
  'B22',
  'F08',
  'M17',
  'SF13',
  'B23',
  'SA05',
  'M18',
  'SF14',
] as const;
const set = new Set<string>(batch7Ids),
  inventory = new Map(inventoryData.recipes.map((r) => [r.id, r])),
  graph = new Map(graphData.nodes.map((r) => [r.id, r]));
const recipes: Recipe[] = readdirSync(resolve(root, 'src/content/recipes'))
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((file) => {
    const p = recipeSchema.safeParse(
      JSON.parse(
        readFileSync(resolve(root, 'src/content/recipes', file), 'utf8'),
      ),
    );
    expect(p.success, file).toBe(true);
    if (!p.success) throw new Error(p.error.message);
    return p.data;
  });
const complete = recipes.filter(
    (r): r is CompleteRecipe => r.contentStatus === 'complete',
  ),
  batch7 = complete.filter((r) => set.has(r.id)),
  byId = new Map(batch7.map((r) => [r.id, r]));
describe('Phase 3 Batch 7 editorial handoff gate', () => {
  it('retains the authorized ten records after later batches are promoted', () => {
    expect(recipes).toHaveLength(80);
    expect(complete.length).toBeGreaterThanOrEqual(70);
    expect(
      recipes.filter((r) => r.contentStatus === 'stub').length,
    ).toBeLessThanOrEqual(10);
    expect(batch7.map((r) => r.id).sort()).toEqual([...batch7Ids].sort());
    for (const r of complete)
      expect(completeRecipeSchema.safeParse(r).success, r.id).toBe(true);
  });
  it('preserves every Batch 7 identity, release, URL, and relationship lock', () => {
    for (const r of batch7) {
      const l = inventory.get(r.id),
        g = graph.get(r.id);
      expect(r).toMatchObject({
        id: l?.id,
        title: l?.title,
        category: l?.category,
        canonicalSlug: l?.slug,
        canonicalUrl: l?.canonicalUrl,
        releaseCohort: l?.releaseCohort,
        publicReleaseOrder: l?.publicReleaseOrder,
        menuPairings: g?.menuPairings,
        relatedRecipeIds: g?.relatedRecipeIds,
      });
    }
  });
  it('keeps every Batch 7 record unpublished, non-indexable, unmonetized, and behind human gates', () => {
    for (const r of batch7) {
      expect(r).toMatchObject({
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
      expect(r.instructions).toHaveLength(6);
      expect(r.instructions.every((s) => s.safetyNote)).toBe(true);
      expect(r.sourcesAndEditorialNotes.join(' ')).toMatch(/not test-cooked/i);
    }
    expect(
      registryData.entries.filter(
        (e) => e.type === 'recipe' && set.has(e.id) && e.indexable,
      ),
    ).toEqual([]);
  });
  it('enforces live-bivalve source, shell-opening, and discard rules and complete abalone prep', () => {
    for (const id of ['SF12', 'SF13']) {
      const r = byId.get(id);
      expect(r?.seafoodPreparation).not.toBeNull();
      expect(r?.seafoodPreparation?.buyingCues.join(' ')).toMatch(
        /tag|label|source/i,
      );
      expect(r?.seafoodPreparation?.shellOpeningAndDiscardGuidance).toMatch(
        /does not open|do not open|non-opening/i,
      );
      expect(r?.foodSafetyNotes.join(' ')).toMatch(
        /discard.*non-opening|non-opening.*discard/i,
      );
    }
    expect(byId.get('SF14')?.seafoodPreparation).not.toBeNull();
    expect(byId.get('SF14')?.targetInternalTemperature).toMatch(
      /145°F \/ 63°C/,
    );
    expect(byId.get('SF14')?.foodSafetyNotes.join(' ')).toMatch(
      /viscera|choking/i,
    );
  });
  it('applies raw-sprout screening and refrigerator-only garlic controls', () => {
    const sprouts = byId.get('F08'),
      garlic = byId.get('B23');
    expect(sprouts?.foodSafetyNotes.join(' ')).toMatch(
      /inside seeds|washing cannot/i,
    );
    expect(sprouts?.foodSafetyNotes.join(' ')).toMatch(/pregnant|higher-risk/i);
    expect(sprouts?.storage).toMatch(/discard/i);
    expect(garlic?.foodSafetyNotes.join(' ')).toMatch(
      /refrigerator.*only|not.*shelf-stable/i,
    );
    expect(garlic?.foodSafetyNotes.join(' ')).toMatch(/5% acidity/i);
    expect(garlic?.targetInternalTemperature).toMatch(/40°F \/ 4°C/i);
  });
  it('applies poultry, cold-salad, and individual dipping-sauce controls', () => {
    for (const id of ['M17', 'M18']) {
      const r = byId.get(id);
      expect(r?.targetInternalTemperature).toMatch(/165°F \/ 74°C/);
      expect(r?.foodSafetyNotes.join(' ')).toMatch(/do not wash/i);
      expect(
        r?.marinadeOrSeasoning?.rawContactDiscardOrReboilInstruction,
      ).toMatch(/discard/i);
    }
    for (const id of ['B21', 'B22'])
      expect(byId.get(id)?.foodSafetyNotes.join(' ')).toMatch(
        /pasteurized mayonnaise|cool.*promptly/i,
      );
    expect(byId.get('SA05')?.foodSafetyNotes.join(' ')).toMatch(
      /individual portions/i,
    );
    expect(byId.get('SA05')?.foodSafetyNotes.join(' ')).toMatch(/discard/i);
  });
  it('retains Batch 7 in a project state that has reached at least that checkpoint', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData.unresolvedCriticalErrors).toBe(0);
    expect(stateData.contentStatusCounts.complete).toBeGreaterThanOrEqual(70);
    expect(stateData.phase3Batches.planned).toBe(8);
    expect(stateData.phase3Batches.completed).toBeGreaterThanOrEqual(7);
  });
});
