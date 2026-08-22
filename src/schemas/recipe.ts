import { z } from 'zod';

import {
  hasCompleteHumanGateEvidence,
  humanReviewGateKeys,
  isActualPublicationText,
  isActualProfileUrl,
  publicationStatuses,
} from '../lib/publication-governance';

export const recipeCategories = [
  'grilled-meat',
  'seafood',
  'banchan',
  'fresh',
  'sauces',
  'desserts',
] as const;

const reviewStatusSchema = z.enum(['required', 'approved']);
const editorialStatusSchema = z.enum(publicationStatuses);
const releaseCohortSchema = z.enum([
  'initial',
  'week-01',
  'week-02',
  'week-03',
  'week-04',
  'week-05',
  'week-06',
  'week-07',
  'week-08',
  'week-09',
  'week-10',
  'week-11',
  'week-12',
  'week-13',
]);
const recipeIdSchema = z.string().regex(/^(M|SF|B|F|SA|D)\d{2}$/);
const durationSchema = z.object({
  minutes: z.number().int().nonnegative(),
  display: z.string().min(1),
});

const ingredientSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  item: z.string().min(1),
  metricAmount: z.number().positive().nullable(),
  metricUnit: z.string().min(1).nullable(),
  customaryAmount: z.number().positive().nullable(),
  customaryUnit: z.string().min(1).nullable(),
  preparation: z.string().nullable(),
  optional: z.boolean(),
  allergenNotes: z.array(z.string()),
});

const ingredientGroupSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  heading: z.string().min(1),
  ingredients: z.array(ingredientSchema).min(1),
});

const instructionSchema = z.object({
  step: z.number().int().positive(),
  heading: z.string().min(1),
  action: z.string().min(1),
  estimatedTime: z.string().nullable(),
  temperature: z.string().nullable(),
  visualOrTactileCue: z.string().min(1),
  safetyNote: z.string().nullable(),
  mediaReference: z.string().nullable(),
});

const marinadeOrSeasoningSchema = z.object({
  type: z.enum(['marinade', 'seasoning', 'paired-grilling-preparation']),
  ingredients: z.array(ingredientSchema).min(1),
  batchYield: z.string().min(1),
  meatWeightCovered: z.string().min(1),
  mixOrder: z.array(z.string().min(1)).min(1),
  marinationVessel: z.string().min(1),
  refrigeratedMarinationTimeRange: z.string().min(1),
  maximumPracticalMarinationWarning: z.string().nullable(),
  reserveBeforeRawContactInstruction: z.string().min(1),
  rawContactDiscardOrReboilInstruction: z.string().min(1),
  substitutions: z.array(z.string()),
  allergenNotes: z.array(z.string()),
});

const seafoodPreparationSchema = z.object({
  buyingCues: z.array(z.string().min(1)).min(1),
  thawing: z.string().min(1),
  cleaningOrShellPreparation: z.string().min(1),
  drying: z.string().min(1),
  scoringOrSkewering: z.string().nullable(),
  grillSurfacePreparation: z.string().min(1),
  stickingPrevention: z.string().min(1),
  approximateTime: z.string().min(1),
  donenessCues: z.array(z.string().min(1)).min(1),
  applicableTemperature: z.string().nullable(),
  shellOpeningAndDiscardGuidance: z.string().nullable(),
  crossContactNotes: z.array(z.string().min(1)).min(1),
});

const allergenSchema = z.object({
  soy: z.boolean(),
  wheatGluten: z.boolean(),
  sesame: z.boolean(),
  fish: z.boolean(),
  shellfish: z.boolean(),
  egg: z.boolean(),
  dairy: z.boolean(),
  peanuts: z.boolean(),
  treeNuts: z.boolean(),
  alcohol: z.boolean(),
  crossContactWarning: z.string().min(1),
});

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const profileUrlSchema = z
  .string()
  .url()
  .refine(isActualProfileUrl, {
    message:
      'Profile URLs must be real HTTPS URLs without credentials or placeholders.',
  })
  .nullable()
  .default(null);

/**
 * A status alone is not review evidence. Each gate records the accountable
 * person, their role, the review date, and a durable evidence reference. Draft
 * records receive the deny-by-default values below until a human completes the
 * work; no name, credential, date, or evidence is invented by the build.
 */
const humanReviewGateSchema = z.object({
  status: reviewStatusSchema,
  reviewerName: z.string().trim().min(2).nullable().default(null),
  reviewerProfileUrl: profileUrlSchema,
  reviewerRole: z.string().trim().min(2).nullable().default(null),
  reviewerCredential: z.string().trim().min(2).nullable().default(null),
  reviewedAt: z.iso.date().nullable().default(null),
  evidence: z.string().trim().min(3).nullable().default(null),
});

const pendingHumanReviewGate = {
  status: 'required' as const,
  reviewerName: null,
  reviewerProfileUrl: null,
  reviewerRole: null,
  reviewerCredential: null,
  reviewedAt: null,
  evidence: null,
};

const reviewGatesSchema = z
  .object({
    testCook: humanReviewGateSchema,
    foodSafety: humanReviewGateSchema,
    koreanLanguage: humanReviewGateSchema,
    editorial: humanReviewGateSchema,
  })
  .default({
    testCook: pendingHumanReviewGate,
    foodSafety: pendingHumanReviewGate,
    koreanLanguage: pendingHumanReviewGate,
    editorial: pendingHumanReviewGate,
  });

const canonicalUrlSchema = z.string().refine(
  (value) =>
    value.startsWith('https://kbbqguide.com/') ||
    (() => {
      try {
        return new globalThis.URL(value).protocol === 'https:';
      } catch {
        return false;
      }
    })(),
  'Canonical URLs must be absolute HTTPS URLs or use the locked domain placeholder.',
);

export const completeRecipeSchema = z
  .object({
    contentStatus: z.literal('complete'),
    id: recipeIdSchema,
    title: z.string().min(1),
    koreanName: z.string().nullable(),
    hangul: z.string().nullable(),
    romanization: z.string().nullable(),
    category: z.enum(recipeCategories),
    releaseCohort: releaseCohortSchema,
    publicReleaseOrder: z.number().int().min(1).max(80),
    canonicalSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    canonicalUrl: canonicalUrlSchema,
    shortDescription: z.string().min(1),
    culturalContext: z.string().min(1),
    adaptationLabel: z.enum([
      'classic',
      'regional',
      'restaurant-style',
      'contemporary',
      'none',
    ]),
    editorialStatus: editorialStatusSchema,
    testCookStatus: reviewStatusSchema,
    foodSafetyReview: reviewStatusSchema,
    koreanLanguageReview: reviewStatusSchema,
    editorialReviewStatus: reviewStatusSchema.default('required'),
    author: z.string().min(1),
    authorProfileUrl: profileUrlSchema,
    reviewer: z.string().nullable(),
    createdAt: z.iso.date(),
    updatedAt: z.iso.date(),
    materiallyUpdatedAt: z.iso.date().nullable().default(null),
    publishedAt: z.iso.date().nullable(),
    reviewGates: reviewGatesSchema,
    yield: z.number().positive(),
    servingUnit: z.string().min(1),
    prepTime: durationSchema,
    marinateTime: durationSchema,
    cookTime: durationSchema,
    restTime: durationSchema,
    totalTime: durationSchema,
    equipment: z.array(z.string().min(1)).min(1),
    ingredientGroups: z.array(ingredientGroupSchema).min(1),
    marinadeOrSeasoning: marinadeOrSeasoningSchema.nullable(),
    instructions: z.array(instructionSchema).min(1),
    grillSetup: z.string().min(1),
    targetInternalTemperature: z.string().nullable(),
    visualDonenessCues: z.array(z.string().min(1)).min(1),
    foodSafetyNotes: z.array(z.string().min(1)).min(1),
    allergens: allergenSchema,
    substitutions: z.array(z.string()),
    ingredientSourcing: z.array(z.string()),
    makeAhead: z.string().min(1),
    storage: z.string().min(1),
    reheating: z.string().min(1),
    leftovers: z.string().min(1),
    servingSuggestions: z.array(z.string()),
    menuPairings: z.array(z.string().regex(/^(M|SF|B|F|SA|D)\d{2}$/)),
    relatedRecipeIds: z.array(z.string().regex(/^(M|SF|B|F|SA|D)\d{2}$/)),
    faq: z.array(faqSchema),
    seoTitle: z.string().min(20).max(65),
    metaDescription: z.string().min(70).max(160),
    primaryKeyword: z.string().min(1),
    secondaryTopics: z.array(z.string()),
    imageManifestIds: z.array(z.string()),
    videoManifestId: z.string().nullable(),
    transcriptId: z.string().nullable(),
    affiliateModuleIds: z.array(z.string()),
    adExclusionZones: z.array(z.string()).min(1),
    nutritionStatus: z.literal('not-calculated'),
    sourcesAndEditorialNotes: z.array(z.string()).min(1),
    seafoodPreparation: seafoodPreparationSchema.nullable(),
  })
  .superRefine((recipe, context) => {
    const expectedPrefix = {
      'grilled-meat': 'M',
      seafood: 'SF',
      banchan: 'B',
      fresh: 'F',
      sauces: 'SA',
      desserts: 'D',
    }[recipe.category];

    if (!recipe.id.startsWith(expectedPrefix)) {
      context.addIssue({
        code: 'custom',
        path: ['id'],
        message: `Recipe ID must use the ${expectedPrefix} prefix for ${recipe.category}.`,
      });
    }

    if (
      recipe.category === 'grilled-meat' &&
      recipe.marinadeOrSeasoning === null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['marinadeOrSeasoning'],
        message:
          'Every grilled-meat recipe requires an integrated marinade or seasoning section.',
      });
    }

    if (recipe.category === 'seafood' && recipe.seafoodPreparation === null) {
      context.addIssue({
        code: 'custom',
        path: ['seafoodPreparation'],
        message:
          'Every seafood recipe requires the complete seafood preparation and safety section.',
      });
    }

    const reviewStatusPairs = [
      ['testCook', 'testCookStatus'],
      ['foodSafety', 'foodSafetyReview'],
      ['koreanLanguage', 'koreanLanguageReview'],
      ['editorial', 'editorialReviewStatus'],
    ] as const;

    for (const [gateKey, legacyStatusField] of reviewStatusPairs) {
      if (recipe.reviewGates[gateKey].status !== recipe[legacyStatusField]) {
        context.addIssue({
          code: 'custom',
          path: ['reviewGates', gateKey, 'status'],
          message: `${gateKey} gate status must match ${legacyStatusField}.`,
        });
      }
    }

    const requiresCompletedHumanReview =
      recipe.editorialStatus === 'reviewed' ||
      recipe.editorialStatus === 'published';

    if (requiresCompletedHumanReview) {
      for (const gateKey of humanReviewGateKeys) {
        if (
          !hasCompleteHumanGateEvidence(
            recipe.reviewGates[gateKey],
            gateKey === 'foodSafety',
          )
        ) {
          context.addIssue({
            code: 'custom',
            path: ['reviewGates', gateKey],
            message: `${gateKey} requires an approved status, named reviewer, reviewer profile URL, reviewer role${gateKey === 'foodSafety' ? ', reviewer credential' : ''}, review date, and evidence reference before a recipe can be reviewed or published.`,
          });
        }
      }
    }

    if (recipe.editorialStatus === 'published' && recipe.publishedAt === null) {
      context.addIssue({
        code: 'custom',
        path: ['publishedAt'],
        message: 'Published recipes require a real publication date.',
      });
    }

    if (
      recipe.editorialStatus === 'published' &&
      !isActualPublicationText(recipe.author)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['author'],
        message:
          'Published recipes require a named author, not a placeholder or generic value.',
      });
    }

    if (
      recipe.editorialStatus === 'published' &&
      !isActualProfileUrl(recipe.authorProfileUrl)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['authorProfileUrl'],
        message:
          'Published recipes require a real HTTPS author profile URL, not a placeholder.',
      });
    }

    if (
      recipe.editorialStatus === 'published' &&
      recipe.materiallyUpdatedAt === null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['materiallyUpdatedAt'],
        message: 'Published recipes require a materially updated date.',
      });
    }

    if (
      recipe.materiallyUpdatedAt !== null &&
      recipe.materiallyUpdatedAt < recipe.createdAt
    ) {
      context.addIssue({
        code: 'custom',
        path: ['materiallyUpdatedAt'],
        message:
          'Materially updated date cannot precede the recipe creation date.',
      });
    }

    if (recipe.publishedAt !== null && recipe.publishedAt < recipe.createdAt) {
      context.addIssue({
        code: 'custom',
        path: ['publishedAt'],
        message: 'Publication date cannot precede the recipe creation date.',
      });
    }
  });

export const recipeStubSchema = z
  .object({
    contentStatus: z.literal('stub'),
    id: recipeIdSchema,
    title: z.string().min(1),
    koreanName: z.null(),
    hangul: z.null(),
    romanization: z.null(),
    category: z.enum(recipeCategories),
    releaseCohort: releaseCohortSchema,
    publicReleaseOrder: z.number().int().min(1).max(80),
    canonicalSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    canonicalUrl: canonicalUrlSchema,
    shortDescription: z.null(),
    culturalContext: z.null(),
    adaptationLabel: z.null(),
    editorialStatus: z.literal('draft'),
    testCookStatus: z.literal('required'),
    foodSafetyReview: z.literal('required'),
    koreanLanguageReview: z.literal('required'),
    author: z.literal('{{LEGAL_NAME}}'),
    reviewer: z.null(),
    createdAt: z.iso.date(),
    updatedAt: z.iso.date(),
    publishedAt: z.null(),
    yield: z.null(),
    servingUnit: z.null(),
    prepTime: z.null(),
    marinateTime: z.null(),
    cookTime: z.null(),
    restTime: z.null(),
    totalTime: z.null(),
    equipment: z.array(z.never()).length(0),
    ingredientGroups: z.array(z.never()).length(0),
    marinadeOrSeasoning: z.null(),
    instructions: z.array(z.never()).length(0),
    grillSetup: z.null(),
    targetInternalTemperature: z.null(),
    visualDonenessCues: z.array(z.never()).length(0),
    foodSafetyNotes: z.array(z.never()).length(0),
    allergens: z.null(),
    substitutions: z.array(z.never()).length(0),
    ingredientSourcing: z.array(z.never()).length(0),
    makeAhead: z.null(),
    storage: z.null(),
    reheating: z.null(),
    leftovers: z.null(),
    servingSuggestions: z.array(z.never()).length(0),
    menuPairings: z.array(recipeIdSchema).min(3),
    relatedRecipeIds: z.array(recipeIdSchema).min(2),
    faq: z.array(z.never()).length(0),
    seoTitle: z.null(),
    metaDescription: z.null(),
    primaryKeyword: z.null(),
    secondaryTopics: z.array(z.never()).length(0),
    imageManifestIds: z.array(z.never()).length(0),
    videoManifestId: z.null(),
    transcriptId: z.null(),
    affiliateModuleIds: z.array(z.never()).length(0),
    adExclusionZones: z.array(z.never()).length(0),
    nutritionStatus: z.literal('not-calculated'),
    sourcesAndEditorialNotes: z.tuple([
      z.literal('Phase 2 structural stub; no recipe prose generated.'),
    ]),
    seafoodPreparation: z.null(),
  })
  .superRefine((recipe, context) => {
    const expectedPrefix = {
      'grilled-meat': 'M',
      seafood: 'SF',
      banchan: 'B',
      fresh: 'F',
      sauces: 'SA',
      desserts: 'D',
    }[recipe.category];

    if (!recipe.id.startsWith(expectedPrefix)) {
      context.addIssue({
        code: 'custom',
        path: ['id'],
        message: `Recipe ID must use the ${expectedPrefix} prefix for ${recipe.category}.`,
      });
    }

    if (
      recipe.relatedRecipeIds.includes(recipe.id) ||
      recipe.menuPairings.includes(recipe.id)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['relatedRecipeIds'],
        message: 'A recipe cannot relate or pair to itself.',
      });
    }
  });

export const recipeSchema = z.union([recipeStubSchema, completeRecipeSchema]);

export type RecipeStub = z.infer<typeof recipeStubSchema>;
export type CompleteRecipe = z.infer<typeof completeRecipeSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
