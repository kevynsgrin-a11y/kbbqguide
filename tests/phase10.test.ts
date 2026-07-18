import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import {
  isDisplayableTaxonomy,
  formatDisplayAmount,
  unitDuplicatesItem,
  shouldShowIngredientItem,
  formatIngredientMeasure,
  formatIngredientTail,
} from '../src/lib/ingredients';
import type { Ingredient } from '../src/lib/ingredients';
import { consolidateShoppingList } from '../src/lib/planner';
import type { CompleteRecipe } from '../src/schemas/recipe';

function loadRecipe(id: string): CompleteRecipe {
  const file = path.join('src/content/recipes', `${id.toLowerCase()}.json`);
  return JSON.parse(readFileSync(file, 'utf8')) as CompleteRecipe;
}

// A minimal ingredient shape for the pure display helpers.
const ing = (o: Partial<Record<string, unknown>>) =>
  ({
    metricAmount: null,
    metricUnit: null,
    customaryAmount: null,
    customaryUnit: null,
    item: '',
    preparation: null,
    optional: false,
    ...o,
  }) as unknown as Ingredient;

describe('Phase 10.2 — taxonomy chip suppression (P1-9)', () => {
  it('suppresses placeholder taxonomy values', () => {
    for (const v of [
      'none',
      'None',
      'NONE',
      'draft',
      'placeholder',
      'tbd',
      '',
      '  ',
      null,
      undefined,
    ]) {
      expect(isDisplayableTaxonomy(v)).toBe(false);
    }
  });
  it('keeps real taxonomy labels', () => {
    for (const v of [
      'classic',
      'restaurant-style',
      'contemporary',
      'regional',
    ]) {
      expect(isDisplayableTaxonomy(v)).toBe(true);
    }
  });
  it('no recipe card would render a "none" adaptation chip in built HTML', () => {
    const dist = 'dist';
    // Only assert when a build exists (CI builds before linting/testing).
    try {
      readdirSync(dist);
    } catch {
      return;
    }
    const html = readFileSync(path.join(dist, 'recipes', 'index.html'), 'utf8');
    expect(/·\s*none\b/i.test(html)).toBe(false);
  });
});

describe('Phase 10.2 — human display rounding (P1-9)', () => {
  it('rounds grams/millilitres to human quantities (nearest 10 >=100, 5 in 5-100)', () => {
    expect(formatDisplayAmount(333.33, 'g')).toBe('330 g');
    expect(formatDisplayAmount(66.67, 'g')).toBe('65 g');
    expect(formatDisplayAmount(453.33, 'g')).toBe('450 g');
    expect(formatDisplayAmount(486.66, 'ml')).toBe('490 ml');
  });
  it('never renders a misleading "0 g" for tiny amounts', () => {
    expect(formatDisplayAmount(0.44, 'g')).toBe('0.5 g');
    expect(formatDisplayAmount(1.33, 'g')).toBe('1.5 g');
  });
  it('converts fractional litres/kilograms to ml/g, keeps whole units', () => {
    expect(formatDisplayAmount(0.25, 'l')).toBe('250 ml');
    expect(formatDisplayAmount(2, 'l')).toBe('2 l');
    expect(formatDisplayAmount(1.27, 'l')).toBe('1270 ml');
  });
  it('renders customary volumes as kitchen fractions', () => {
    expect(formatDisplayAmount(0.75, 'cup')).toBe('¾ cup');
    expect(formatDisplayAmount(1 / 3, 'teaspoon')).toBe('⅓ teaspoon');
    expect(formatDisplayAmount(0.5, 'tablespoons')).toBe('½ tablespoons');
    expect(formatDisplayAmount(2, 'cups')).toBe('2 cups');
  });
  it('renders counts as integers, fractional counts as kitchen fractions', () => {
    expect(formatDisplayAmount(6, 'large eggs')).toBe('6 large eggs');
    expect(formatDisplayAmount(2.5, 'scallions')).toBe('2½ scallions');
  });
  it('produces no >=2-decimal artifacts for any unit', () => {
    const units = ['g', 'ml', 'kg', 'l', 'cup', 'teaspoon', 'scallions'];
    for (const u of units) {
      for (const a of [0.33, 0.44, 66.67, 333.33, 1.27, 2.67]) {
        expect(formatDisplayAmount(a, u)).not.toMatch(/\d\.\d{2,}/);
      }
    }
  });
});

describe('Phase 10.2 — duplicate-noun suppression (P1-9)', () => {
  it('detects unit that duplicates the item noun', () => {
    expect(unitDuplicatesItem('scallions', 'scallions')).toBe(true);
    expect(unitDuplicatesItem('scallion', 'scallions')).toBe(true);
    expect(unitDuplicatesItem('large eggs', 'large eggs')).toBe(true);
    expect(unitDuplicatesItem('clove', 'garlic')).toBe(false);
    expect(unitDuplicatesItem('g', 'scallions')).toBe(false);
  });
  it('hides the redundant item but keeps the noun visible via the measure', () => {
    const scallion = ing({
      metricAmount: 15,
      metricUnit: 'g',
      customaryAmount: 1,
      customaryUnit: 'scallion',
      item: 'scallion',
      preparation: 'thinly sliced',
    });
    expect(shouldShowIngredientItem(scallion)).toBe(false);
    const line = `${formatIngredientMeasure(scallion)}${formatIngredientTail(scallion).startsWith(',') ? '' : ' '}${formatIngredientTail(scallion)}`;
    expect(line).toBe('15 g / 1 scallion, thinly sliced');
    expect(/scallion\s+scallion/i.test(line)).toBe(false);
  });
  it('keeps the item when the unit is a real unit', () => {
    const garlic = ing({
      metricAmount: 6,
      metricUnit: 'g',
      customaryAmount: 2,
      customaryUnit: 'cloves',
      item: 'garlic',
      preparation: 'minced',
    });
    expect(shouldShowIngredientItem(garlic)).toBe(true);
    expect(formatIngredientTail(garlic)).toBe('garlic, minced');
  });
});

describe('Phase 10.2 — canonical shopping consolidation (P1-9)', () => {
  it('merges scallion/scallions variants and rounds every measure', () => {
    const recipes = [loadRecipe('B01'), loadRecipe('B02')];
    const list = consolidateShoppingList(recipes, 4);
    const scallionLines = list.filter((l) => /scallion/i.test(l.item));
    expect(scallionLines.length).toBe(1);
    for (const line of list) {
      expect(line.display).not.toMatch(/\d\.\d{2,}\s?(g|ml|kg|l)\b/);
    }
  });
  it('places a multi-unit ingredient on a single line', () => {
    // Yakgwa (honey by mass) + a recipe using honey by volume consolidate to one honey line.
    const recipes = [
      'M03',
      'M17',
      'SF07',
      'B01',
      'B10',
      'B15',
      'F01',
      'F06',
      'SA01',
      'SA05',
      'D03',
    ].map(loadRecipe);
    const list = consolidateShoppingList(recipes, 8);
    const honey = list.filter((l) => /^honey$/i.test(l.item));
    expect(honey.length).toBe(1);
  });
});
