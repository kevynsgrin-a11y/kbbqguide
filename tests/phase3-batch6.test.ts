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
const batch6Ids = [
  'B16',
  'F05',
  'SF10',
  'SF11',
  'B17',
  'F06',
  'B18',
  'B19',
  'B20',
  'F07',
] as const;
const batch6Set = new Set<string>(batch6Ids);
const inventoryById = new Map(inventoryData.recipes.map((r) => [r.id, r]));
const graphById = new Map(graphData.nodes.map((r) => [r.id, r]));
const recipes: Recipe[] = readdirSync(resolve(root, 'src/content/recipes'))
  .filter((f) => f.endsWith('.json'))
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
  (r): r is CompleteRecipe => r.contentStatus === 'complete',
);
const batch6 = complete.filter((r) => batch6Set.has(r.id));
const byId = new Map(batch6.map((r) => [r.id, r]));

describe('Phase 3 Batch 6 editorial handoff gate', () => {
  it('keeps all ten authorized Batch 6 records complete in later checkpoints', () => {
    expect(recipes).toHaveLength(80);
    expect(complete.length).toBeGreaterThanOrEqual(60);
    expect(batch6.map((r) => r.id).sort()).toEqual([...batch6Ids].sort());
    for (const r of complete)
      expect(completeRecipeSchema.safeParse(r).success, r.id).toBe(true);
  });
  it('preserves every Batch 6 identity, release, URL, and relationship lock', () => {
    for (const r of batch6) {
      const locked = inventoryById.get(r.id),
        graph = graphById.get(r.id);
      expect(r).toMatchObject({
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
  it('keeps every Batch 6 record unpublished, non-indexable, unmonetized, and behind human gates', () => {
    for (const r of batch6) {
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
        (e) => e.type === 'recipe' && batch6Set.has(e.id) && e.indexable,
      ),
    ).toEqual([]);
  });
  it('restricts gosari to commercially processed product and doraji to identified refrigerated soaking', () => {
    expect(byId.get('B16')?.foodSafetyNotes.join(' ')).toMatch(
      /commercially processed|fully softened/i,
    );
    expect(byId.get('B16')?.foodSafetyNotes.join(' ')).toMatch(
      /do not forage/i,
    );
    expect(byId.get('B17')?.foodSafetyNotes.join(' ')).toMatch(
      /identified|package/i,
    );
    expect(byId.get('B17')?.foodSafetyNotes.join(' ')).toMatch(/refrigerat/i);
  });
  it('gives both seafood records full 145°F sections with divided glaze controls', () => {
    for (const id of ['SF10', 'SF11']) {
      const r = byId.get(id);
      expect(r?.seafoodPreparation).not.toBeNull();
      expect(r?.targetInternalTemperature).toMatch(/145°F \/ 63°C/);
      expect(r?.seafoodPreparation?.thawing).toMatch(
        /refrigerator|cold water/i,
      );
      expect(r?.seafoodPreparation?.crossContactNotes.join(' ')).toMatch(
        /reserve|glaze/i,
      );
      expect(r?.foodSafetyNotes.join(' ')).toMatch(/pin bones/i);
    }
  });
  it('applies ready-to-eat produce, egg, beef, and hot-glaze controls', () => {
    for (const id of ['F05', 'F06', 'F07']) {
      const r = byId.get(id);
      expect(r?.foodSafetyNotes.join(' ')).toMatch(/running water/i);
      expect(r?.foodSafetyNotes.join(' ')).toMatch(/ready-to-eat/i);
      expect(r?.targetInternalTemperature).toBeNull();
    }
    expect(byId.get('B18')?.foodSafetyNotes.join(' ')).toMatch(
      /syrup|boiling/i,
    );
    expect(byId.get('B19')?.foodSafetyNotes.join(' ')).toMatch(/firm/i);
    expect(byId.get('B19')?.foodSafetyNotes.join(' ')).toMatch(/choking/i);
    expect(byId.get('B20')?.targetInternalTemperature).toMatch(
      /145°F \/ 63°C.*3-minute rest/i,
    );
    expect(byId.get('B20')?.targetInternalTemperature).toMatch(
      /fork-tender|tender/i,
    );
  });
  it('records a state at or beyond the completed Batch 6 checkpoint', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData.phase3Batches.planned).toBe(8);
    expect(stateData.phase3Batches.completed).toBeGreaterThanOrEqual(6);
    expect(stateData.contentStatusCounts.complete).toBeGreaterThanOrEqual(60);
    expect(stateData.unresolvedCriticalErrors).toBe(0);
  });
});
