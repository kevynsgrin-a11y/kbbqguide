import type { CompleteRecipe } from '../schemas/recipe';

export type RecipeCategory = CompleteRecipe['category'];

export interface CategoryDefinition {
  id: string;
  slug: RecipeCategory;
  label: string;
  shortLabel: string;
  eyebrow: string;
  description: string;
  accent: string;
}

export const categories: readonly CategoryDefinition[] = [
  {
    id: 'CAT_MEAT',
    slug: 'grilled-meat',
    label: 'Grilled Meat',
    shortLabel: 'Meat',
    eyebrow: 'Fire & timing',
    description:
      'Marinades, two-zone grilling, thermometer cues, and conservative endpoints for beef, pork, poultry, duck, and lamb.',
    accent: 'ember',
  },
  {
    id: 'CAT_SEAFOOD',
    slug: 'seafood',
    label: 'Seafood',
    shortLabel: 'Seafood',
    eyebrow: 'Source & doneness',
    description:
      'Species-specific buying, cleaning, sticking prevention, shell-opening rules, and doneness cues.',
    accent: 'ocean',
  },
  {
    id: 'CAT_BANCHAN',
    slug: 'banchan',
    label: 'Banchan',
    shortLabel: 'Banchan',
    eyebrow: 'Small plates',
    description:
      'Cooked, chilled, quick-pickled, and seasoned sides designed to balance a tabletop spread.',
    accent: 'leaf',
  },
  {
    id: 'CAT_FRESH',
    slug: 'fresh',
    label: 'Fresh & Wraps',
    shortLabel: 'Fresh',
    eyebrow: 'Crisp & bright',
    description:
      'Ready-to-eat greens, salads, wraps, and cool contrasts with explicit produce handling.',
    accent: 'spring',
  },
  {
    id: 'CAT_SAUCES',
    slug: 'sauces',
    label: 'Sauces',
    shortLabel: 'Sauces',
    eyebrow: 'Finish & dip',
    description:
      'Measured dipping sauces and condiments with clean-service, allergen, and raw-contact boundaries.',
    accent: 'pepper',
  },
  {
    id: 'CAT_DESSERTS',
    slug: 'desserts',
    label: 'Desserts & Drinks',
    shortLabel: 'Desserts',
    eyebrow: 'A soft landing',
    description:
      'Traditional and contemporary sweets and drinks with hot-sugar, flour, dairy, and cooling controls.',
    accent: 'honey',
  },
] as const;

export function categoryBySlug(slug: string): CategoryDefinition {
  const category = categories.find((item) => item.slug === slug);
  if (!category) throw new Error(`Unknown recipe category: ${slug}`);
  return category;
}
