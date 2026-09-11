import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import canonicalData from '../data/ingredient-canonical.json';
import nutritionData from '../data/ingredient-nutrition.json';
import {
  formatPer100gLine,
  recipeNutritionCoverage,
  type IngredientNutritionData,
} from '../src/lib/ingredient-nutrition';
import { recipeSchema, type CompleteRecipe } from '../src/schemas/recipe';

const root = resolve(import.meta.dirname, '..');
const canonical = canonicalData as {
  map: Record<string, { id: string; displayName: string }>;
};
const data = nutritionData as unknown as IngredientNutritionData;

function readRecipes(): CompleteRecipe[] {
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
      return parsed.data as CompleteRecipe;
    });
}

describe('ingredient nutrition reference data', () => {
  it('covers every canonical ingredient id the site can reference', () => {
    const expectedIds = new Set(
      Object.values(canonical.map).map((entry) => entry.id),
    );
    const actualIds = new Set(Object.keys(data.ingredients));
    expect([...expectedIds].filter((id) => !actualIds.has(id))).toEqual([]);
    expect([...actualIds].filter((id) => !expectedIds.has(id))).toEqual([]);
  });

  it('carries provenance for resolved entries and no numbers for unresolved ones', () => {
    let resolved = 0;
    let unresolved = 0;
    for (const [id, entry] of Object.entries(data.ingredients)) {
      if (entry.resolved) {
        resolved += 1;
        expect(entry.fdcId, id).toEqual(expect.any(Number));
        expect(entry.dataType, id).toEqual(expect.any(String));
        expect(entry.per100g, id).toBeDefined();
        expect(Object.keys(entry.per100g ?? {}).length, id).toBeGreaterThan(0);
      } else {
        unresolved += 1;
        expect(entry.per100g, id).toBeUndefined();
        expect(entry.fdcId, id).toBeUndefined();
      }
    }
    expect(resolved).toBe(data.counts.resolved);
    expect(unresolved).toBe(data.counts.unresolved);
    expect(data.counts.resolved).toBeGreaterThan(0);
  });

  it('stamps the dictionary snapshot date and FDC attribution', () => {
    expect(data.dictionaryFetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(data.fdcAttribution.url).toBe('https://fdc.nal.usda.gov');
    expect(data.fdcAttribution.text).toContain('FoodData Central');
  });

  it('joins every recipe to resolved rows or flags ids as unverified', () => {
    const recipes = readRecipes();
    expect(recipes.length).toBeGreaterThan(0);
    let anyResolvedRow = false;
    for (const recipe of recipes) {
      const { rows, unresolvedIds } = recipeNutritionCoverage(recipe);
      for (const row of rows) {
        anyResolvedRow = true;
        expect(row.resolved).toBe(true);
        for (const sourceItem of row.sourceItems) {
          expect(canonical.map[sourceItem]?.displayName).toBe(row.displayName);
        }
      }
      const totalRefs = new Set(
        [
          ...recipe.ingredientGroups.flatMap((group) => group.ingredients),
          ...(recipe.marinadeOrSeasoning?.ingredients ?? []),
        ].map((ingredient) => ingredient.id),
      );
      expect(rows.length + unresolvedIds.length).toBe(totalRefs.size);
    }
    // The dictionary snapshot must resolve at least one recipe ingredient so
    // the reference panel is exercised by real content.
    expect(anyResolvedRow).toBe(true);
  });

  it('formats only the core nutrients the dictionary actually carries', () => {
    expect(formatPer100gLine(undefined)).toBe('');
    expect(
      formatPer100gLine({ kcal: 333, protein_g: 10, fat_g: 0, carbs_g: 76.7 }),
    ).toBe('333 kcal, 10 g protein, 0 g fat, 76.7 g carbs (per 100 g)');
    expect(formatPer100gLine({ protein_g: 4 })).toBe('4 g protein (per 100 g)');
    expect(formatPer100gLine({ fiber_g: 2 })).toBe('');
  });
});
