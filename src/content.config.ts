import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { recipeSchema } from './schemas/recipe';

const recipes = defineCollection({
  loader: glob({
    pattern: '**/*.{json,yaml,yml}',
    base: './src/content/recipes',
  }),
  schema: recipeSchema,
});

export const collections = { recipes };
