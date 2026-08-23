import type { CompleteRecipe } from '../schemas/recipe';
import { categoryBySlug } from './categories';
import { recipeAccountability } from './publication-governance';
import {
  isApprovedRecipeStructuredDataImageSet,
  type ApprovedRecipeStructuredDataImageSet,
} from './recipe-structured-data-images';

export const siteOrigin = 'https://kbbqguide.com';

export function canonicalUrl(path: string): string {
  if (!path.startsWith('/') || !path.endsWith('/') || path.includes('..'))
    throw new Error(`Unsafe canonical path: ${path}`);
  return new globalThis.URL(path, siteOrigin).href;
}

export interface LinkedDataItem {
  readonly name: string;
  readonly path: string;
}

export function breadcrumbJsonLd(items: readonly LinkedDataItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function itemListJsonLd(name: string, items: readonly LinkedDataItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: canonicalUrl(item.path),
    })),
  };
}

function durationToIso(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `PT${hours > 0 ? `${hours}H` : ''}${remainder > 0 ? `${remainder}M` : hours === 0 ? '0M' : ''}`;
}

function ingredientText(
  ingredient: CompleteRecipe['ingredientGroups'][number]['ingredients'][number],
): string {
  const metric =
    ingredient.metricAmount && ingredient.metricUnit
      ? `${ingredient.metricAmount} ${ingredient.metricUnit}`
      : '';
  const customary =
    ingredient.customaryAmount && ingredient.customaryUnit
      ? `${ingredient.customaryAmount} ${ingredient.customaryUnit}`
      : '';
  const amount = [metric, customary].filter(Boolean).join(' / ');
  return [
    amount,
    ingredient.item,
    ingredient.preparation,
    ingredient.optional ? 'optional' : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Emits Recipe JSON-LD only for a fully attributable, published recipe with
 * approved public image evidence. Drafts and records without that evidence
 * return null, which keeps callers fail-closed even if they miss a release
 * state check.
 */
export function recipeJsonLd(
  recipe: CompleteRecipe,
  path: string,
  imageSet: ApprovedRecipeStructuredDataImageSet | null = null,
) {
  const accountability = recipeAccountability(recipe);
  if (
    accountability === null ||
    !isApprovedRecipeStructuredDataImageSet(imageSet, recipe.id)
  )
    return null;

  const approvedImages = imageSet.urls;

  const category = categoryBySlug(recipe.category);
  const keywords = [
    ...new Set([recipe.primaryKeyword, ...recipe.secondaryTopics]),
  ]
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .join(', ');

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    '@id': `${canonicalUrl(path)}#recipe`,
    url: canonicalUrl(path),
    name: recipe.title,
    description: recipe.shortDescription,
    inLanguage: 'en',
    image: approvedImages,
    author: {
      '@type': 'Person',
      name: accountability.author.name,
      url: accountability.author.profileUrl,
    },
    datePublished: accountability.publishedAt,
    dateModified: accountability.materiallyUpdatedAt,
    recipeCuisine: 'Korean',
    recipeCategory: category.label,
    keywords,
    recipeYield: `${recipe.yield} ${recipe.servingUnit}`,
    prepTime: durationToIso(recipe.prepTime.minutes),
    cookTime: durationToIso(recipe.cookTime.minutes),
    totalTime: durationToIso(recipe.totalTime.minutes),
    recipeIngredient: recipe.ingredientGroups.flatMap((group) =>
      group.ingredients.map(ingredientText),
    ),
    recipeInstructions: recipe.instructions.map((instruction) => ({
      '@type': 'HowToStep',
      position: instruction.step,
      name: instruction.heading,
      text: [
        instruction.action,
        `Cue: ${instruction.visualOrTactileCue}`,
        instruction.safetyNote ? `Safety: ${instruction.safetyNote}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    })),
  };
}
