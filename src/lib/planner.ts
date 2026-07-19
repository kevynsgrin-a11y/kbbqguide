import { scaleQuantity } from './scaling';
import { formatDisplayAmount } from './ingredients';
import canonicalData from '../../data/ingredient-canonical.json';
import type { CompleteRecipe } from '../schemas/recipe';

export interface ShoppingLine {
  /** Canonical ingredient id (consolidation key). */
  readonly id: string;
  /** Canonical display name. */
  readonly item: string;
  /** Fully formatted, human-rounded measure string (e.g. "260 g", "20 ml + 80 g", ""). */
  readonly display: string;
  readonly recipeIds: readonly string[];
  readonly optional: boolean;
}

interface CanonicalEntry {
  id: string;
  displayName: string;
  plural: string;
}

const canonicalMap = (canonicalData.map ?? {}) as Record<
  string,
  CanonicalEntry
>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function canonicalFor(item: string): CanonicalEntry {
  const hit = canonicalMap[item.trim()];
  if (hit) return hit;
  return { id: slugify(item), displayName: item, plural: item };
}

/** Normalise l -> ml and kg -> g so equivalent measures consolidate onto one line. */
function normaliseUnit(
  amount: number,
  unit: string | null,
): { amount: number; unit: string } {
  const u = (unit ?? '').trim().toLowerCase();
  if (u === 'l') return { amount: amount * 1000, unit: 'ml' };
  if (u === 'kg') return { amount: amount * 1000, unit: 'g' };
  return { amount, unit: (unit ?? 'as-needed').trim() };
}

// Order units so mass/volume lead, then everything else alphabetically.
const UNIT_PRIORITY: Record<string, number> = { g: 0, ml: 1 };
function unitSort(a: string, b: string): number {
  const pa = UNIT_PRIORITY[a.toLowerCase()] ?? 10;
  const pb = UNIT_PRIORITY[b.toLowerCase()] ?? 10;
  return pa - pb || a.localeCompare(b);
}

export function consolidateShoppingList(
  recipes: readonly CompleteRecipe[],
  targetServings: number,
): ShoppingLine[] {
  if (!Number.isInteger(targetServings) || targetServings <= 0)
    throw new Error('Target servings must be a positive integer.');

  const groups = new Map<
    string,
    {
      id: string;
      item: string;
      units: Map<string, number>;
      asNeeded: boolean;
      recipeIds: Set<string>;
      optional: boolean;
    }
  >();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredientGroups.flatMap(
      (group) => group.ingredients,
    )) {
      const canonical = canonicalFor(ingredient.item);
      const rawAmount = ingredient.metricAmount ?? ingredient.customaryAmount;
      const rawUnit = ingredient.metricUnit ?? ingredient.customaryUnit;

      const group = groups.get(canonical.id) ?? {
        id: canonical.id,
        item: canonical.displayName,
        units: new Map<string, number>(),
        asNeeded: false,
        recipeIds: new Set<string>(),
        optional: true,
      };

      if (rawAmount == null) {
        group.asNeeded = true;
      } else {
        const scaled = scaleQuantity(rawAmount, recipe.yield, targetServings);
        const { amount, unit } = normaliseUnit(scaled, rawUnit);
        group.units.set(unit, (group.units.get(unit) ?? 0) + amount);
      }

      group.recipeIds.add(recipe.id);
      group.optional &&= ingredient.optional;
      groups.set(canonical.id, group);
    }
  }

  return [...groups.values()]
    .map((group) => {
      const parts = [...group.units.entries()]
        .sort((a, b) => unitSort(a[0], b[0]))
        .map(([unit, amount]) =>
          formatDisplayAmount(amount, unit === 'as-needed' ? null : unit),
        )
        .filter(Boolean);
      if (group.asNeeded && parts.length === 0) parts.push('as needed');
      else if (group.asNeeded) parts.push('plus as needed');
      return {
        id: group.id,
        item: group.item,
        display: parts.join(' + '),
        recipeIds: [...group.recipeIds].sort(),
        optional: group.optional,
      };
    })
    .sort((a, b) => a.item.localeCompare(b.item));
}
