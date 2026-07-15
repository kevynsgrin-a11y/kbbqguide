import { describe, expect, it } from 'vitest';

import { recipeSchema } from '../src/schemas/recipe';

function makeDraftFixture() {
  return {
    contentStatus: 'complete',
    id: 'B01',
    title: 'Schema Validation Fixture',
    koreanName: null,
    hangul: null,
    romanization: null,
    category: 'banchan',
    releaseCohort: 'initial',
    publicReleaseOrder: 1,
    canonicalSlug: 'schema-validation-fixture',
    canonicalUrl:
      'https://kbbqguide.com/recipes/banchan/schema-validation-fixture/',
    shortDescription:
      'Non-publishable fixture used only to validate the recipe contract.',
    culturalContext: 'No cultural claim is made in this schema-only fixture.',
    adaptationLabel: 'none',
    editorialStatus: 'draft',
    testCookStatus: 'required',
    foodSafetyReview: 'required',
    koreanLanguageReview: 'required',
    author: '{{LEGAL_NAME}}',
    reviewer: null,
    createdAt: '2026-07-13',
    updatedAt: '2026-07-13',
    publishedAt: null,
    yield: 4,
    servingUnit: 'servings',
    prepTime: { minutes: 10, display: '10 minutes' },
    marinateTime: { minutes: 0, display: 'None' },
    cookTime: { minutes: 5, display: '5 minutes' },
    restTime: { minutes: 0, display: 'None' },
    totalTime: { minutes: 15, display: '15 minutes' },
    equipment: ['Test vessel'],
    ingredientGroups: [
      {
        id: 'fixture-ingredients',
        heading: 'Fixture ingredients',
        ingredients: [
          {
            id: 'fixture-item',
            item: 'Fixture ingredient',
            metricAmount: 100,
            metricUnit: 'g',
            customaryAmount: 1,
            customaryUnit: 'cup',
            preparation: null,
            optional: false,
            allergenNotes: [],
          },
        ],
      },
    ],
    marinadeOrSeasoning: null,
    instructions: [
      {
        step: 1,
        heading: 'Validate',
        action: 'Use this non-recipe fixture to validate the field contract.',
        estimatedTime: '1 minute',
        temperature: null,
        visualOrTactileCue: 'The validator returns success.',
        safetyNote: null,
        mediaReference: null,
      },
    ],
    grillSetup: 'Not applicable to this schema fixture.',
    targetInternalTemperature: null,
    visualDonenessCues: ['Not applicable to this schema fixture.'],
    foodSafetyNotes: ['Human food-safety review remains required.'],
    allergens: {
      soy: false,
      wheatGluten: false,
      sesame: false,
      fish: false,
      shellfish: false,
      egg: false,
      dairy: false,
      peanuts: false,
      treeNuts: false,
      alcohol: false,
      crossContactWarning: 'Check every label and control cross-contact.',
    },
    substitutions: [],
    ingredientSourcing: [],
    makeAhead: 'Not applicable to this schema fixture.',
    storage: 'Not applicable to this schema fixture.',
    reheating: 'Not applicable to this schema fixture.',
    leftovers: 'Not applicable to this schema fixture.',
    servingSuggestions: [],
    menuPairings: [],
    relatedRecipeIds: [],
    faq: [],
    seoTitle: 'Schema Validation Fixture for Recipe Content',
    metaDescription:
      'A non-production fixture that validates required recipe fields without creating a publishable recipe record or food claim.',
    primaryKeyword: 'schema fixture',
    secondaryTopics: [],
    imageManifestIds: [],
    videoManifestId: null,
    transcriptId: null,
    affiliateModuleIds: [],
    adExclusionZones: ['ingredients', 'safety-warning', 'instructions'],
    nutritionStatus: 'not-calculated',
    sourcesAndEditorialNotes: ['Schema-only test fixture; not recipe content.'],
    seafoodPreparation: null,
  } as const;
}

describe('recipe schema', () => {
  it('accepts a complete draft contract with all human reviews required', () => {
    expect(recipeSchema.safeParse(makeDraftFixture()).success).toBe(true);
  });

  it('rejects a published record with unresolved review gates', () => {
    const fixture = {
      ...makeDraftFixture(),
      editorialStatus: 'published',
      publishedAt: '2026-07-13',
    };
    expect(recipeSchema.safeParse(fixture).success).toBe(false);
  });

  it('requires the integrated meat preparation section', () => {
    const fixture = {
      ...makeDraftFixture(),
      id: 'M01',
      category: 'grilled-meat',
      canonicalUrl:
        'https://kbbqguide.com/recipes/grilled-meat/schema-validation-fixture/',
    };
    expect(recipeSchema.safeParse(fixture).success).toBe(false);
  });

  it('requires the complete seafood preparation section', () => {
    const fixture = {
      ...makeDraftFixture(),
      id: 'SF01',
      category: 'seafood',
      canonicalUrl:
        'https://kbbqguide.com/recipes/seafood/schema-validation-fixture/',
    };
    expect(recipeSchema.safeParse(fixture).success).toBe(false);
  });
});
