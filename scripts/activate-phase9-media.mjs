import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifestPath = join(root, 'data/media-manifest.json');
const recipeDir = join(root, 'src/content/recipes');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const recipes = readdirSync(recipeDir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(join(recipeDir, name), 'utf8')))
  .sort((a, b) => a.publicReleaseOrder - b.publicReleaseOrder);

const generatedAt = '2026-07-16';
const creator = 'OpenAI image generation under KBBQGuide editorial direction';

function recipeAsset(recipe) {
  return {
    assetId: `${recipe.id}-hero`,
    kind: 'image',
    role: 'finished-dish-hero',
    assetStatus: 'synthetic-labeled',
    path: `src/assets/media/recipes/${recipe.id.toLowerCase()}/hero-master.jpg`,
    width: 2400,
    height: 1600,
    aspectRatio: '3:2',
    focalPoint: '50% 50%',
    mobileCrop: 'center-safe',
    altDecision: 'informative',
    altText: `Finished ${recipe.title} presented in a warm Korean dining setting.`,
    caption: `${recipe.title}, visualized for the KBBQGuide editorial preview.`,
    credit: 'Synthetic image · KBBQGuide editorial direction / OpenAI',
    provenance: {
      creator,
      generatedAt,
      sourceRecord: recipe.id,
      promptBasis:
        'Recipe title, short description, ingredients, instructions, and food-safety cues',
      disclosure:
        'AI-generated editorial visualization; not a photograph of a test-kitchen cook.',
    },
    rights: {
      source: 'Original synthetic campaign created for this repository',
      scope: 'KBBQGuide site, social preview, and editorial promotion',
      externalLicense: null,
    },
    qa: {
      implementationVisualReview: 'pass',
      implementationFoodSafetyScreen: 'pass',
      implementationCulturalAndIngredientScreen: 'pass',
      responsiveCropReview: 'pass',
      humanEditorialReview: 'required',
      reviewer: 'Phase 9 implementation agent; human sign-off not inferred',
    },
  };
}

const homeAsset = {
  assetId: 'HOME-gathering-hero',
  kind: 'image',
  role: 'brand-lifestyle-hero',
  assetStatus: 'synthetic-labeled',
  path: 'src/assets/media/brand/home-gathering-master.jpg',
  width: 2400,
  height: 1600,
  aspectRatio: '3:2',
  focalPoint: '58% 50%',
  mobileCrop: 'center-safe',
  altDecision: 'informative',
  altText:
    'Four adult friends sharing a Korean barbecue table around an indoor electric grill.',
  caption: 'A warm, shared Korean barbecue table, visualized for KBBQGuide.',
  credit: 'Synthetic image · KBBQGuide editorial direction / OpenAI',
  provenance: {
    creator,
    generatedAt,
    sourceRecord: 'HOME',
    promptBasis:
      'Brand brief for a calm, safety-aware Korean barbecue gathering at home',
    disclosure:
      'AI-generated editorial visualization; people shown are synthetic.',
  },
  rights: {
    source: 'Original synthetic campaign created for this repository',
    scope: 'KBBQGuide site, social preview, and editorial promotion',
    externalLicense: null,
  },
  qa: {
    implementationVisualReview: 'pass',
    implementationFoodSafetyScreen: 'pass',
    implementationCulturalAndIngredientScreen: 'pass',
    responsiveCropReview: 'pass',
    humanEditorialReview: 'required',
    reviewer: 'Phase 9 implementation agent; human sign-off not inferred',
  },
};

const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
for (const plan of manifest.recipePlans) {
  const recipe = byId.get(plan.recipeId);
  if (!recipe) throw new Error(`Missing recipe record for ${plan.recipeId}`);
  const asset = recipeAsset(recipe);
  plan.hero = {
    ...plan.hero,
    assetStatus: asset.assetStatus,
    path: asset.path,
    width: asset.width,
    height: asset.height,
    aspectRatio: asset.aspectRatio,
    focalPoint: asset.focalPoint,
    mobileCrop: asset.mobileCrop,
    loading: 'priority-on-detail-lazy-elsewhere',
    altDecision: asset.altDecision,
    altText: asset.altText,
    caption: asset.caption,
    credit: asset.credit,
    provenance: asset.provenance,
    rights: asset.rights,
    qa: asset.qa,
  };
  plan.provenance =
    'finished-dish-hero-synthetic-labeled; remaining shot plan pending';
  plan.rightsStatus =
    'hero-cleared-original-synthetic; remaining-assets-pending';
  plan.qaStatus =
    'hero-implementation-screen-pass-human-review-required; remaining-assets-not-started';
}

manifest.version = 3;
manifest.phase = 9;
manifest.status = 'implementation-screened-synthetic-hero-campaign-active';
manifest.generatedAt = generatedAt;
manifest.assets = [homeAsset, ...recipes.map(recipeAsset)];
manifest.notes =
  'Phase 9 activates one implementation-screened synthetic finished-dish hero for every recipe plus a brand lifestyle hero. Named human review remains required. Planned process stills and videos remain honest placeholders.';
manifest.responsiveImageContract = {
  ...manifest.responsiveImageContract,
  formats: ['avif', 'webp', 'jpeg'],
  requiredAspectRatios: ['3:2', '16:9', '4:3', '1:1'],
  widths: [360, 640, 960, 1280, 1600],
  intrinsicDimensionsRequiredBeforeActivation: true,
  belowFoldLoading: 'lazy',
  heroLoading: 'eager-with-high-fetch-priority',
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const csv = [
  [
    'asset_id',
    'role',
    'status',
    'path',
    'dimensions',
    'alt_decision',
    'credit',
    'implementation_qa',
    'human_review',
  ],
  ...manifest.assets.map((asset) => [
    asset.assetId,
    asset.role,
    asset.assetStatus,
    asset.path,
    `${asset.width}x${asset.height}`,
    asset.altDecision,
    asset.credit,
    asset.qa.implementationVisualReview,
    asset.qa.humanEditorialReview,
  ]),
]
  .map((row) =>
    row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
  )
  .join('\n');
writeFileSync(join(root, 'docs/media-assets-phase9.csv'), `${csv}\n`);
