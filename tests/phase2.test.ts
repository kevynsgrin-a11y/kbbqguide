import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import graphData from '../data/recipe-relationship-graph.json';
import inventoryData from '../data/recipe-inventory.json';
import releaseData from '../data/release-matrix.json';
import registryData from '../data/url-registry.json';
import stateData from '../project-state.json';
import { validateUrlRegistry, type UrlRegistry } from '../src/lib/url-registry';
import { recipeSchema } from '../src/schemas/recipe';

const root = resolve(import.meta.dirname, '..');
const expectedCounts = {
  'grilled-meat': 20,
  seafood: 15,
  banchan: 25,
  fresh: 10,
  sauces: 5,
  desserts: 5,
};
const expectedRemainingCounts = {
  'grilled-meat': 13,
  seafood: 11,
  banchan: 16,
  fresh: 7,
  sauces: 2,
  desserts: 3,
};
const expectedWeeklyCounts = [
  { 'grilled-meat': 2, banchan: 1, sauces: 1 },
  { 'grilled-meat': 2, banchan: 2 },
  { 'grilled-meat': 2, banchan: 1, fresh: 1 },
  { 'grilled-meat': 1, seafood: 2, banchan: 1 },
  { 'grilled-meat': 1, seafood: 2, banchan: 1 },
  { 'grilled-meat': 1, seafood: 1, banchan: 1, fresh: 1 },
  { seafood: 2, banchan: 1, fresh: 1 },
  { banchan: 3, fresh: 1 },
  { seafood: 1, banchan: 2, fresh: 1 },
  { 'grilled-meat': 1, seafood: 1, banchan: 1, sauces: 1 },
  { 'grilled-meat': 1, seafood: 1, banchan: 1, desserts: 1 },
  { 'grilled-meat': 1, seafood: 1, fresh: 1, desserts: 1 },
  { 'grilled-meat': 1, banchan: 1, fresh: 1, desserts: 1 },
];
const inventory = inventoryData.recipes;
const registry = registryData as UrlRegistry;
const inventoryById = new Map(inventory.map((recipe) => [recipe.id, recipe]));

function countCategories(ids: readonly string[]) {
  const counts: Record<string, number> = {};
  for (const id of ids) {
    const recipe = inventoryById.get(id);
    if (!recipe) throw new Error(`Release matrix references unknown ID ${id}.`);
    counts[recipe.category] = (counts[recipe.category] ?? 0) + 1;
  }
  return counts;
}

describe('Phase 2 inventory and structural foundation gate', () => {
  it('locks the exact 80-item inventory and category totals', () => {
    expect(inventory).toHaveLength(80);
    expect(inventoryData.total).toBe(80);
    expect(inventoryData.categoryCounts).toEqual(expectedCounts);

    const actualCounts = countCategories(inventory.map((recipe) => recipe.id));
    expect(actualCounts).toEqual(expectedCounts);
    expect(new Set(inventory.map((recipe) => recipe.id)).size).toBe(80);
    expect(new Set(inventory.map((recipe) => recipe.slug)).size).toBe(80);
    expect(new Set(inventory.map((recipe) => recipe.canonicalUrl)).size).toBe(
      80,
    );

    const titleLockHash = createHash('sha256')
      .update(
        inventory
          .map((recipe) => [recipe.id, recipe.title, recipe.category].join('|'))
          .join('\n'),
      )
      .digest('hex');
    expect(titleLockHash).toBe(
      '5cdb955728023b1fe28c12e6c4999440d7d2c0fd7f58433e923941c68fc5bcf9',
    );
  });

  it('keeps exactly 80 schema-valid records and preserves empty fields on remaining stubs', () => {
    const files = readdirSync(resolve(root, 'src/content/recipes'))
      .filter((file) => file.endsWith('.json'))
      .sort();
    expect(files).toHaveLength(80);

    for (const file of files) {
      const stub: unknown = JSON.parse(
        readFileSync(resolve(root, 'src/content/recipes', file), 'utf8'),
      );
      const parsed = recipeSchema.safeParse(stub);
      expect(parsed.success, file).toBe(true);
      if (!parsed.success) continue;

      const recipe = parsed.data;
      const locked = inventoryById.get(recipe.id);
      expect(locked, recipe.id).toBeDefined();
      expect(recipe.title).toBe(locked?.title);
      expect(recipe.canonicalSlug).toBe(locked?.slug);
      expect(recipe.canonicalUrl).toBe(locked?.canonicalUrl);
      expect(recipe.editorialStatus).toBe('draft');
      expect(recipe.testCookStatus).toBe('required');
      expect(recipe.foodSafetyReview).toBe('required');
      expect(recipe.koreanLanguageReview).toBe('required');
      if (recipe.contentStatus === 'stub') {
        expect(recipe.shortDescription).toBeNull();
        expect(recipe.culturalContext).toBeNull();
        expect(recipe.ingredientGroups).toEqual([]);
        expect(recipe.instructions).toEqual([]);
        expect(recipe.marinadeOrSeasoning).toBeNull();
        expect(recipe.seafoodPreparation).toBeNull();
      }
    }
  });

  it('registers every recipe URL as locked and non-indexable with no collisions', () => {
    const recipeEntries = registry.entries.filter(
      (entry) => entry.type === 'recipe',
    );
    expect(registry.entries.length).toBeGreaterThanOrEqual(116);
    expect(recipeEntries).toHaveLength(80);
    expect(validateUrlRegistry(registry)).toEqual([]);

    for (const recipe of inventory) {
      const entry = recipeEntries.find(
        (candidate) => candidate.id === recipe.id,
      );
      expect(entry, recipe.id).toMatchObject({
        title: recipe.title,
        slug: recipe.slug,
        canonicalUrl: recipe.canonicalUrl,
        status: 'locked',
        indexable: false,
      });
    }
  });

  it('builds a valid relationship and cross-category menu-pairing graph', () => {
    expect(graphData.nodes).toHaveLength(80);
    const graphIds = new Set(graphData.nodes.map((node) => node.id));
    expect(graphIds).toEqual(new Set(inventory.map((recipe) => recipe.id)));

    for (const node of graphData.nodes) {
      const recipe = inventoryById.get(node.id);
      expect(recipe, node.id).toBeDefined();
      expect(node.relatedRecipeIds).toHaveLength(2);
      expect(node.menuPairings).toHaveLength(4);
      expect(node.relatedRecipeIds).not.toContain(node.id);
      expect(node.menuPairings).not.toContain(node.id);
      expect(
        new Set([...node.relatedRecipeIds, ...node.menuPairings]).size,
      ).toBe(6);

      for (const relatedId of node.relatedRecipeIds) {
        expect(graphIds.has(relatedId), relatedId).toBe(true);
        expect(inventoryById.get(relatedId)?.category).toBe(recipe?.category);
      }
      for (const pairingId of node.menuPairings) {
        expect(graphIds.has(pairingId), pairingId).toBe(true);
        expect(inventoryById.get(pairingId)?.category).not.toBe(
          recipe?.category,
        );
      }
    }
  });

  it('locks 28 initial records and exactly 52 records across 13 four-item weeks', () => {
    expect(releaseData.initialLaunch.recipeIds).toHaveLength(28);
    expect(countCategories(releaseData.initialLaunch.recipeIds)).toEqual(
      releaseData.initialLaunch.categoryCounts,
    );

    const scheduledIds = releaseData.remaining.weeks.flatMap(
      (week) => week.ids,
    );
    expect(releaseData.remaining.weeks).toHaveLength(13);
    for (const [index, week] of releaseData.remaining.weeks.entries()) {
      expect(week.ids, week.theme).toHaveLength(4);
      expect(countCategories(week.ids), week.theme).toEqual(
        expectedWeeklyCounts[index],
      );
    }
    expect(scheduledIds).toHaveLength(52);
    expect(countCategories(scheduledIds)).toEqual(expectedRemainingCounts);
    expect(releaseData.remaining.categoryCounts).toEqual(
      expectedRemainingCounts,
    );

    const allReleaseIds = [
      ...releaseData.initialLaunch.recipeIds,
      ...scheduledIds,
    ];
    expect(new Set(allReleaseIds).size).toBe(80);
    expect(new Set(allReleaseIds)).toEqual(
      new Set(inventory.map((recipe) => recipe.id)),
    );
    expect(
      inventory
        .map((recipe) => recipe.publicReleaseOrder)
        .sort((a, b) => a - b),
    ).toEqual(Array.from({ length: 80 }, (_, index) => index + 1));
  });

  it('keeps the human-readable URL registry in parity with the machine registry', () => {
    const rows = readFileSync(resolve(root, 'docs/url-registry.csv'), 'utf8')
      .trim()
      .split('\n');
    expect(rows).toHaveLength(registry.entries.length + 1);
  });

  it('retains the Phase 2 locks in project-state as later batches advance', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(2);
    expect(stateData.recipeCounts).toEqual({ total: 80, ...expectedCounts });
    expect(
      stateData.contentStatusCounts.stub +
        stateData.contentStatusCounts.complete,
    ).toBe(80);
    expect(stateData.urlRegistry.entryCount).toBeGreaterThanOrEqual(116);
    expect(stateData.urlRegistry).toMatchObject({
      recipeEntryCount: 80,
      collisionCount: 0,
    });
    expect(stateData.unresolvedCriticalErrors).toBe(0);
  });
});
