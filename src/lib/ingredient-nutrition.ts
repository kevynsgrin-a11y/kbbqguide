import nutritionData from '../../data/ingredient-nutrition.json';
import type { CompleteRecipe } from '../schemas/recipe';

/**
 * Ingredient-level nutrition reference data, built at commit time by
 * scripts/build-ingredient-nutrition.mjs from the TrueAPI portfolio
 * ingredient dictionary (USDA FoodData Central values). This is per-100 g
 * reference data for raw ingredients — never a per-serving analysis of a
 * recipe — and unresolved entries deliberately carry no numbers.
 */
export interface IngredientNutritionEntry {
  displayName: string;
  sourceItems: string[];
  resolved: boolean;
  fdcId?: number | null;
  fdcName?: string | null;
  dataType?: string | null;
  confidence?: number | null;
  per100g?: Record<string, number>;
}

export interface IngredientNutritionData {
  version: number;
  generatedBy: string;
  dictionarySource: string;
  dictionaryFetchedAt: string | null;
  fdcAttribution: { text: string; url: string };
  counts: {
    canonicalIds: number;
    dictionaryEntriesMatched: number;
    resolved: number;
    unresolved: number;
  };
  ingredients: Record<string, IngredientNutritionEntry>;
}

export const ingredientNutritionData =
  nutritionData as unknown as IngredientNutritionData;

export const FDC_ATTRIBUTION = ingredientNutritionData.fdcAttribution;

type RecipeIngredient =
  CompleteRecipe['ingredientGroups'][number]['ingredients'][number];

/** Every distinct ingredient (id + display item) a recipe references. */
export function recipeIngredientRefs(
  recipe: CompleteRecipe,
): { id: string; item: string }[] {
  const groups = [...recipe.ingredientGroups];
  if (recipe.marinadeOrSeasoning) groups.push(recipe.marinadeOrSeasoning);
  const refs = new Map<string, { id: string; item: string }>();
  for (const group of groups) {
    for (const ingredient of group.ingredients as RecipeIngredient[]) {
      if (!refs.has(ingredient.id)) {
        refs.set(ingredient.id, { id: ingredient.id, item: ingredient.item });
      }
    }
  }
  return [...refs.values()];
}

export interface RecipeNutritionCoverage {
  /** Resolved dictionary entries for this recipe, in first-use order. */
  rows: IngredientNutritionEntry[];
  /** Ingredient ids the dictionary has not verified against FDC yet. */
  unresolvedIds: string[];
}

/** Join a recipe's ingredient ids to resolved per-100 g reference rows. */
export function recipeNutritionCoverage(
  recipe: CompleteRecipe,
): RecipeNutritionCoverage {
  const rows: IngredientNutritionEntry[] = [];
  const unresolvedIds: string[] = [];
  const seen = new Set<string>();
  for (const ref of recipeIngredientRefs(recipe)) {
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);
    const entry = ingredientNutritionData.ingredients[ref.id];
    if (!entry) {
      unresolvedIds.push(ref.id);
    } else if (entry.resolved) {
      rows.push(entry);
    } else {
      unresolvedIds.push(ref.id);
    }
  }
  return { rows, unresolvedIds };
}

const CORE_NUTRIENTS = [
  ['kcal', 'kcal'],
  ['protein_g', 'protein'],
  ['fat_g', 'fat'],
  ['carbs_g', 'carbs'],
] as const;

/** "364 kcal, 10 g protein, 1 g fat, 76 g carbs (per 100 g)" — only nutrients present. */
export function formatPer100gLine(
  per100g: Record<string, number> | undefined,
): string {
  if (!per100g) return '';
  const parts: string[] = [];
  for (const [key, label] of CORE_NUTRIENTS) {
    const value = per100g[key];
    if (value == null) continue;
    parts.push(key === 'kcal' ? `${value} kcal` : `${value} g ${label}`);
  }
  return parts.length > 0 ? `${parts.join(', ')} (per 100 g)` : '';
}
