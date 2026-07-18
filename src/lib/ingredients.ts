import type { CompleteRecipe } from '../schemas/recipe';

export type Ingredient =
  CompleteRecipe['ingredientGroups'][number]['ingredients'][number];

/**
 * Taxonomy values that are placeholders / unfinished metadata and must never
 * render as a user-visible chip. Case-insensitive.
 */
export const PLACEHOLDER_TAXONOMY = new Set([
  'none',
  'draft',
  'placeholder',
  'tbd',
]);

/** True when a taxonomy value is a real, displayable label (not a placeholder). */
export function isDisplayableTaxonomy(
  value: string | null | undefined,
): boolean {
  if (value == null) return false;
  const v = value.trim().toLowerCase();
  if (v === '') return false;
  return !PLACEHOLDER_TAXONOMY.has(v);
}

// --- Display-layer rounding (never mutates source data) -----------------------

const UNICODE_FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [0, ''],
  [0.25, '¼'], // ¼
  [1 / 3, '⅓'], // ⅓
  [0.5, '½'], // ½
  [2 / 3, '⅔'], // ⅔
  [0.75, '¾'], // ¾
  [1, ''],
];

const MASS_VOLUME_METRIC = new Set(['g', 'ml', 'kg', 'l']);
const CUSTOMARY_VOLUME = new Set([
  'cup',
  'cups',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'teaspoon',
  'teaspoons',
  'tsp',
  'cups loosely packed',
]);

/**
 * Round grams/millilitres to a human shopping quantity: nearest 10 at >= 100,
 * nearest 5 from 5 to 100, and nearest 0.5 below 5 so small spice amounts never
 * collapse to a misleading "0 g" (a defect worse than the decimal it replaces).
 * Sub-5 g values keep at most one decimal place.
 */
function roundGramsMl(value: number): number {
  if (value <= 0) return 0;
  if (value >= 100) return Math.round(value / 10) * 10;
  if (value >= 5) return Math.round(value / 5) * 5;
  return Math.max(0.5, Math.round(value / 0.5) * 0.5);
}

/** Snap a value to the nearest common kitchen fraction (integer part + {0,¼,⅓,½,⅔,¾}). */
function toKitchenFraction(value: number): string {
  if (value <= 0) return '0';
  const whole = Math.floor(value);
  const frac = value - whole;
  let bestValue = 0;
  let bestGlyph = '';
  let bestDiff = Infinity;
  for (const [fraction, glyph] of UNICODE_FRACTIONS) {
    const diff = Math.abs(frac - fraction);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestValue = fraction;
      bestGlyph = glyph;
    }
  }
  let carry = 0;
  let glyph = bestGlyph;
  if (bestValue === 1) {
    carry = 1;
    glyph = '';
  }
  const wholePart = whole + carry;
  if (glyph === '') return String(wholePart);
  return wholePart > 0 ? `${wholePart}${glyph}` : glyph;
}

/**
 * Format an amount + unit as a human-readable, kitchen-honest string with no
 * >= 2-decimal artifacts anywhere. Litres/kilograms are converted to ml/g when
 * that avoids a fractional display. Returns '' when there is nothing to show.
 */
export function formatDisplayAmount(
  amount: number | null | undefined,
  unit: string | null | undefined,
): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  const rawUnit = (unit ?? '').trim();
  const u = rawUnit.toLowerCase();

  if (MASS_VOLUME_METRIC.has(u)) {
    // Normalise l -> ml and kg -> g unless the value is already a clean whole number.
    let value = amount;
    let outUnit = rawUnit;
    if (u === 'l') {
      if (!Number.isInteger(value)) {
        value = value * 1000;
        outUnit = 'ml';
      }
    } else if (u === 'kg') {
      if (!Number.isInteger(value)) {
        value = value * 1000;
        outUnit = 'g';
      }
    }
    const nu = outUnit.toLowerCase();
    if (nu === 'g' || nu === 'ml') {
      return `${roundGramsMl(value)} ${outUnit}`;
    }
    // whole l / kg
    return `${Math.round(value)} ${outUnit}`;
  }

  if (CUSTOMARY_VOLUME.has(u)) {
    return `${toKitchenFraction(amount)} ${rawUnit}`.trim();
  }

  // Counts and count-nouns (scallions, cloves, eggs, pounds, ounces, slices...).
  // Integers stay integers; fractional counts snap to a kitchen fraction.
  const label = rawUnit ? ` ${rawUnit}` : '';
  if (Number.isInteger(amount)) return `${amount}${label}`.trim();
  return `${toKitchenFraction(amount)}${label}`.trim();
}

// --- Duplicate-noun suppression ----------------------------------------------

/** True when a unit string is really the item noun (e.g. unit "scallions" for item "scallions"). */
export function unitDuplicatesItem(
  unit: string | null | undefined,
  item: string | null | undefined,
): boolean {
  if (!unit || !item) return false;
  const u = unit.trim().toLowerCase();
  const it = item.trim().toLowerCase();
  if (!u || !it) return false;
  const usg = u.replace(/s$/, '');
  const isg = it.replace(/s$/, '');
  return u === it || usg === isg || u === isg || usg === it;
}

/**
 * Whether the ingredient's `item` should render after the measure. It is
 * redundant when a rendered measure part's unit already equals the item noun
 * ("1 scallion" + item "scallion" -> "1 scallion scallion"). We only suppress
 * when the duplicating measure part is actually present, so the noun is never lost.
 */
export function shouldShowIngredientItem(ingredient: Ingredient): boolean {
  const metricPresent =
    ingredient.metricAmount != null && !!ingredient.metricUnit;
  const customaryPresent =
    ingredient.customaryAmount != null && !!ingredient.customaryUnit;
  const metricDup =
    metricPresent && unitDuplicatesItem(ingredient.metricUnit, ingredient.item);
  const customaryDup =
    customaryPresent &&
    unitDuplicatesItem(ingredient.customaryUnit, ingredient.item);
  return !(metricDup || customaryDup);
}

/** The measure string for an ingredient line: "metric / customary", rounded for display. */
export function formatIngredientMeasure(ingredient: Ingredient): string {
  const metric =
    ingredient.metricAmount != null && ingredient.metricUnit
      ? formatDisplayAmount(ingredient.metricAmount, ingredient.metricUnit)
      : '';
  const customary =
    ingredient.customaryAmount != null && ingredient.customaryUnit
      ? formatDisplayAmount(
          ingredient.customaryAmount,
          ingredient.customaryUnit,
        )
      : '';
  return [metric, customary].filter(Boolean).join(' / ');
}

/**
 * The trailing text after the measure span for an ingredient line: the item
 * (unless duplicated by the unit), preparation, and optional flag, assembled so
 * it reads naturally even when the item noun is suppressed.
 */
export function formatIngredientTail(ingredient: Ingredient): string {
  const showItem = shouldShowIngredientItem(ingredient);
  let tail = showItem ? ingredient.item : '';
  if (ingredient.preparation) {
    tail = tail
      ? `${tail}, ${ingredient.preparation}`
      : `, ${ingredient.preparation}`;
  }
  if (ingredient.optional) tail = `${tail} (optional)`;
  return tail;
}
