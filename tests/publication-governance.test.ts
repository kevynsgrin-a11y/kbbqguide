import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  incompleteHumanReviewGateLabels,
  isRecipePublishable,
  recipeAccountability,
  recipeReviewGateDisplayStatuses,
  recipePublishability,
} from '../src/lib/publication-governance';
import { completeRecipeSchema } from '../src/schemas/recipe';

const root = resolve(import.meta.dirname, '..');
const draftSource = JSON.parse(
  readFileSync(resolve(root, 'src/content/recipes/b01.json'), 'utf8'),
);

function draftRecipe() {
  return completeRecipeSchema.parse(JSON.parse(JSON.stringify(draftSource)));
}

function approvedGate(label: string) {
  return {
    status: 'approved' as const,
    reviewerName: `${label} Reviewer`,
    reviewerProfileUrl: `https://profiles.test/${label.toLowerCase().replaceAll(' ', '-')}`,
    reviewerRole: `${label} reviewer`,
    reviewerCredential:
      label === 'Food Safety' ? 'Test food-safety credential' : null,
    reviewedAt: '2026-08-20',
    evidence: `docs/review-records/${label.toLowerCase().replaceAll(' ', '-')}.md`,
  };
}

function publishableRecipe() {
  const recipe = draftRecipe();
  recipe.editorialStatus = 'published';
  recipe.author = 'Test Author';
  recipe.authorProfileUrl = 'https://profiles.test/test-author';
  recipe.materiallyUpdatedAt = '2026-08-21';
  recipe.updatedAt = '2026-08-21';
  recipe.publishedAt = '2026-08-22';
  recipe.testCookStatus = 'approved';
  recipe.foodSafetyReview = 'approved';
  recipe.koreanLanguageReview = 'approved';
  recipe.editorialReviewStatus = 'approved';
  recipe.reviewGates = {
    testCook: approvedGate('Test Cook'),
    foodSafety: approvedGate('Food Safety'),
    koreanLanguage: approvedGate('Korean Language'),
    editorial: approvedGate('Editorial'),
  };
  return recipe;
}

describe('publication governance (P0 #4 and #10)', () => {
  it('parses existing content as explicitly non-public drafts with pending human gates', () => {
    const recipe = draftRecipe();

    expect(recipe.editorialStatus).toBe('draft');
    expect(recipe.materiallyUpdatedAt).toBeNull();
    expect(recipe.authorProfileUrl).toBeNull();
    expect(recipe.reviewGates).toEqual({
      testCook: {
        status: 'required',
        reviewerName: null,
        reviewerProfileUrl: null,
        reviewerRole: null,
        reviewerCredential: null,
        reviewedAt: null,
        evidence: null,
      },
      foodSafety: {
        status: 'required',
        reviewerName: null,
        reviewerProfileUrl: null,
        reviewerRole: null,
        reviewerCredential: null,
        reviewedAt: null,
        evidence: null,
      },
      koreanLanguage: {
        status: 'required',
        reviewerName: null,
        reviewerProfileUrl: null,
        reviewerRole: null,
        reviewerCredential: null,
        reviewedAt: null,
        evidence: null,
      },
      editorial: {
        status: 'required',
        reviewerName: null,
        reviewerProfileUrl: null,
        reviewerRole: null,
        reviewerCredential: null,
        reviewedAt: null,
        evidence: null,
      },
    });
    expect(recipePublishability(recipe).isPublishable).toBe(false);
    expect(recipeAccountability(recipe)).toBeNull();
  });

  it('blocks a published status until author, update, profile, and every human gate carry evidence', () => {
    const recipe = draftRecipe();
    recipe.editorialStatus = 'published';
    recipe.publishedAt = '2026-08-22';
    recipe.testCookStatus = 'approved';
    recipe.foodSafetyReview = 'approved';
    recipe.koreanLanguageReview = 'approved';

    const validation = completeRecipeSchema.safeParse(recipe);
    expect(validation.success).toBe(false);
    expect(recipePublishability(recipe).blockers).toEqual(
      expect.arrayContaining([
        'named author is missing or unresolved',
        'author profile URL is missing or unresolved',
        'materially updated date is missing',
      ]),
    );
  });

  it('fails closed instead of throwing for a legacy raw recipe resolved by a menu', () => {
    const legacyMenuRecipe = {
      ...draftSource,
      editorialStatus: 'published',
      author: 'Legacy Recipe Author',
      authorProfileUrl: 'https://profiles.test/legacy-recipe-author',
      materiallyUpdatedAt: '2026-08-21',
      publishedAt: '2026-08-22',
    };

    expect(legacyMenuRecipe).not.toHaveProperty('reviewGates');
    expect(() => recipePublishability(legacyMenuRecipe)).not.toThrow();
    expect(isRecipePublishable(legacyMenuRecipe)).toBe(false);
    expect(recipePublishability(legacyMenuRecipe).blockers).toEqual(
      expect.arrayContaining([
        'human-review gate record is missing or malformed',
        'testCook human-review evidence is incomplete',
        'foodSafety human-review evidence is incomplete',
        'koreanLanguage human-review evidence is incomplete',
        'editorial human-review evidence is incomplete',
      ]),
    );
  });

  it('renders the raw B01 route shape with required review badges instead of dereferencing missing gates', () => {
    const legacyRawB01 = JSON.parse(JSON.stringify(draftSource));
    legacyRawB01.testCookStatus = 'approved';

    expect(legacyRawB01).not.toHaveProperty('reviewGates');
    expect(() => recipeReviewGateDisplayStatuses(legacyRawB01)).not.toThrow();
    expect(recipeReviewGateDisplayStatuses(legacyRawB01)).toEqual({
      testCook: 'required',
      foodSafety: 'required',
      koreanLanguage: 'required',
      editorial: 'required',
    });
    expect(recipeReviewGateDisplayStatuses(publishableRecipe())).toEqual({
      testCook: 'approved',
      foodSafety: 'approved',
      koreanLanguage: 'approved',
      editorial: 'approved',
    });

    const recipePage = readFileSync(
      resolve(root, 'src/components/RecipePage.astro'),
      'utf8',
    );
    expect(recipePage).toContain('recipeReviewGateDisplayStatuses(recipe)');
    expect(recipePage).not.toContain('recipe.reviewGates.');
  });

  it('describes only the human gates whose evidence remains incomplete', () => {
    const recipe = draftRecipe();
    recipe.testCookStatus = 'approved';
    recipe.reviewGates.testCook = approvedGate('Test Cook');

    expect(incompleteHumanReviewGateLabels(recipe)).toEqual([
      'food-safety review',
      'Korean-language review',
      'editorial review',
    ]);
  });

  it('allows a fully attributable, evidenced publication record and exposes safe accountability data', () => {
    const candidate = publishableRecipe();
    const validation = completeRecipeSchema.safeParse(candidate);

    expect(validation.success).toBe(true);
    if (!validation.success) return;
    expect(isRecipePublishable(validation.data)).toBe(true);
    expect(recipeAccountability(validation.data)).toMatchObject({
      author: {
        name: 'Test Author',
        profileUrl: 'https://profiles.test/test-author',
      },
      testCook: {
        name: 'Test Cook Reviewer',
        profileUrl: 'https://profiles.test/test-cook',
      },
      materiallyUpdatedAt: '2026-08-21',
      publishedAt: '2026-08-22',
    });
  });
});
