import { scaleQuantity } from './scaling';
import type { CompleteRecipe } from '../schemas/recipe';

export interface ShoppingLine {
  readonly item: string;
  readonly amount: number | null;
  readonly unit: string | null;
  readonly recipeIds: readonly string[];
  readonly optional: boolean;
}

export function consolidateShoppingList(
  recipes: readonly CompleteRecipe[],
  targetServings: number,
): ShoppingLine[] {
  if (!Number.isInteger(targetServings) || targetServings <= 0)
    throw new Error('Target servings must be a positive integer.');

  const rows = new Map<
    string,
    {
      item: string;
      amount: number | null;
      unit: string | null;
      recipeIds: Set<string>;
      optional: boolean;
    }
  >();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredientGroups.flatMap(
      (group) => group.ingredients,
    )) {
      const amount = ingredient.metricAmount ?? ingredient.customaryAmount;
      const unit = ingredient.metricUnit ?? ingredient.customaryUnit;
      const key = `${ingredient.item.toLowerCase()}|${unit ?? 'as-needed'}`;
      const existing = rows.get(key) ?? {
        item: ingredient.item,
        amount: amount === null ? null : 0,
        unit,
        recipeIds: new Set<string>(),
        optional: true,
      };
      if (amount !== null) {
        existing.amount =
          Math.round(
            ((existing.amount ?? 0) +
              scaleQuantity(amount, recipe.yield, targetServings)) *
              100,
          ) / 100;
      }
      existing.recipeIds.add(recipe.id);
      existing.optional &&= ingredient.optional;
      rows.set(key, existing);
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      recipeIds: [...row.recipeIds].sort(),
    }))
    .sort((a, b) => a.item.localeCompare(b.item));
}
