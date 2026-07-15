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
const batch5Ids = [
  'M14',
  'SF05',
  'SF06',
  'B14',
  'M15',
  'SF07',
  'SF08',
  'B15',
  'M16',
  'SF09',
] as const;
const batch5Set = new Set<string>(batch5Ids);
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
const batch5 = complete.filter((r) => batch5Set.has(r.id));
const byId = new Map(batch5.map((r) => [r.id, r]));

describe('Phase 3 Batch 5 editorial handoff gate', () => {
  it('keeps all ten authorized Batch 5 records complete in later checkpoints', () => {
    expect(recipes).toHaveLength(80);
    expect(complete.length).toBeGreaterThanOrEqual(50);
    expect(batch5.map((r) => r.id).sort()).toEqual([...batch5Ids].sort());
    for (const r of complete)
      expect(completeRecipeSchema.safeParse(r).success, r.id).toBe(true);
  });
  it('preserves every Batch 5 identity, release, URL, and relationship lock', () => {
    for (const r of batch5) {
      const locked = inventoryById.get(r.id);
      const graph = graphById.get(r.id);
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
  it('keeps every Batch 5 record unpublished, non-indexable, unmonetized, and behind human gates', () => {
    for (const r of batch5) {
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
        (e) => e.type === 'recipe' && batch5Set.has(e.id) && e.indexable,
      ),
    ).toEqual([]);
  });
  it('gives every seafood record a complete 145°F preparation and cross-contact section', () => {
    for (const id of ['SF05', 'SF06', 'SF07', 'SF08', 'SF09']) {
      const r = byId.get(id);
      expect(r?.seafoodPreparation).not.toBeNull();
      expect(r?.targetInternalTemperature).toMatch(/145°F \/ 63°C/);
      expect(r?.seafoodPreparation?.thawing).toMatch(
        /refrigerator|cold water/i,
      );
      expect(
        r?.seafoodPreparation?.crossContactNotes.length,
      ).toBeGreaterThanOrEqual(3);
      expect(r?.grillSetup).toMatch(/outdoor|electric/i);
    }
    expect(byId.get('SF07')?.foodSafetyNotes.join(' ')).toMatch(
      /histamine|temperature abused/i,
    );
    for (const id of ['SF07', 'SF08', 'SF09'])
      expect(byId.get(id)?.foodSafetyNotes.join(' ')).toMatch(/bone/i);
  });
  it('separates whole-cut pork, ribs tenderness, and poultry controls', () => {
    for (const id of ['M14', 'M15', 'M16']) {
      const r = byId.get(id);
      expect(r?.marinadeOrSeasoning).not.toBeNull();
      expect(
        r?.marinadeOrSeasoning?.rawContactDiscardOrReboilInstruction,
      ).toMatch(/discard/i);
    }
    expect(byId.get('M14')?.targetInternalTemperature).toMatch(
      /145°F \/ 63°C.*3-minute rest/i,
    );
    expect(byId.get('M15')?.targetInternalTemperature).toMatch(/145°F \/ 63°C/);
    expect(byId.get('M15')?.targetInternalTemperature).toMatch(
      /tenderness|test cooking/i,
    );
    expect(byId.get('M16')?.targetInternalTemperature).toMatch(/165°F \/ 74°C/);
    expect(byId.get('M16')?.foodSafetyNotes.join(' ')).toMatch(/do not wash/i);
  });
  it('applies package-first dried-fish and shellfish-aware zucchini controls', () => {
    expect(byId.get('B14')?.foodSafetyNotes.join(' ')).toMatch(
      /package|rancid/i,
    );
    expect(byId.get('B14')?.allergens.fish).toBe(true);
    expect(byId.get('B15')?.foodSafetyNotes.join(' ')).toMatch(
      /shellfish|saeujeot/i,
    );
    expect(byId.get('B15')?.allergens.shellfish).toBe(true);
  });
  it('records a state at or beyond the completed Batch 5 checkpoint', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(3);
    expect(stateData.phase3Batches.planned).toBe(8);
    expect(stateData.phase3Batches.completed).toBeGreaterThanOrEqual(5);
    expect(stateData.contentStatusCounts.complete).toBeGreaterThanOrEqual(50);
    expect(stateData.unresolvedCriticalErrors).toBe(0);
  });
});
