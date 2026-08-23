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
const editorialGeneratedAt = '2026-07-17';
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
  mobileCrop: 'people-right',
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

function editorialAsset({
  assetId,
  role,
  path,
  sourceRecord,
  promptBasis,
  altText,
  caption,
  focalPoint = '50% 50%',
  mobileCrop = 'center-safe',
  altDecision = 'informative',
}) {
  return {
    assetId,
    kind: 'image',
    role,
    assetStatus: 'synthetic-labeled',
    path,
    width: 2400,
    height: 1600,
    aspectRatio: '3:2',
    focalPoint,
    mobileCrop,
    altDecision,
    altText: altDecision === 'decorative' ? '' : altText,
    caption,
    credit: 'Synthetic image · KBBQGuide editorial direction / OpenAI',
    provenance: {
      creator,
      generatedAt: editorialGeneratedAt,
      sourceRecord,
      promptBasis,
      disclosure:
        'AI-generated editorial visualization; not documentary photography or test-kitchen evidence.',
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

const editorialAssetPlans = [
  {
    assetId: 'HOME-editorial-banner',
    role: 'brand-lifestyle-banner',
    path: 'src/assets/media/brand/home-editorial-banner-master.jpg',
    sourceRecord: 'HOME-lower-banner',
    promptBasis:
      'Adult friends passing ssam and banchan across a safely staged Korean barbecue table',
    altText:
      'Adult friends passing lettuce wraps and banchan across a warmly lit Korean barbecue table.',
    caption: 'The table comes together through passing, wrapping, and sharing.',
    focalPoint: '62% 48%',
    mobileCrop: 'people-right',
  },
  {
    assetId: 'CAT_MEAT-hero',
    role: 'category-editorial-hero',
    path: 'src/assets/media/categories/grilled-meat-master.jpg',
    sourceRecord: 'CAT_MEAT',
    promptBasis:
      'Safe tabletop grilling of marinated meat with cooked-food landing zone and ssam',
    altText:
      'Cooked marinated meat browning on a stainless tabletop grill beside ssam greens and banchan.',
    caption: 'Grilled meat, paced in small batches for the shared table.',
    focalPoint: '58% 50%',
    mobileCrop: 'subject-right',
  },
  {
    assetId: 'CAT_SEAFOOD-hero',
    role: 'category-editorial-hero',
    path: 'src/assets/media/categories/seafood-master.jpg',
    sourceRecord: 'CAT_SEAFOOD',
    promptBasis:
      'Distinct cooked seafood selection with species-aware grilling cues and clean service dishes',
    altText:
      'Grilled shrimp, fish, and shellfish arranged with clean serving dishes on a Korean barbecue table.',
    caption: 'Seafood with species-specific preparation and doneness in view.',
    focalPoint: '56% 52%',
    mobileCrop: 'subject-right',
  },
  {
    assetId: 'CAT_BANCHAN-hero',
    role: 'category-editorial-hero',
    path: 'src/assets/media/categories/banchan-master.jpg',
    sourceRecord: 'CAT_BANCHAN',
    promptBasis:
      'Varied cooked, seasoned, chilled, and pickled banchan in cream ceramics',
    altText:
      'An assortment of colorful banchan in cream ceramic dishes on a charcoal table.',
    caption: 'Small plates bring contrast, rhythm, and make-ahead ease.',
    focalPoint: '54% 50%',
    mobileCrop: 'center-safe',
  },
  {
    assetId: 'CAT_FRESH-hero',
    role: 'category-editorial-hero',
    path: 'src/assets/media/categories/fresh-master.jpg',
    sourceRecord: 'CAT_FRESH',
    promptBasis:
      'Washed, dried ssam greens and crisp fresh sides ready for clean service',
    altText:
      'Fresh lettuce, perilla leaves, sliced vegetables, and composed wraps on clean serving dishes.',
    caption: 'Crisp greens and wraps keep the table bright.',
    focalPoint: '58% 48%',
    mobileCrop: 'subject-right',
  },
  {
    assetId: 'CAT_SAUCES-hero',
    role: 'category-editorial-hero',
    path: 'src/assets/media/categories/sauces-master.jpg',
    sourceRecord: 'CAT_SAUCES',
    promptBasis:
      'Clean-service Korean dipping sauces and condiments in individual ceramic dishes',
    altText:
      'Ssamjang and several Korean barbecue dipping sauces in small cream ceramic bowls.',
    caption: 'Measured sauces and condiments finish each bite.',
    focalPoint: '58% 52%',
    mobileCrop: 'subject-right',
  },
  {
    assetId: 'CAT_DESSERTS-hero',
    role: 'category-editorial-hero',
    path: 'src/assets/media/categories/desserts-master.jpg',
    sourceRecord: 'CAT_DESSERTS',
    promptBasis:
      'Distinct Korean desserts and drinks served after the grill is safely shut down',
    altText:
      'Korean sweets, fruit, and chilled drinks arranged as a calm finish to dinner.',
    caption: 'A warm, restrained finish after the grill.',
    focalPoint: '56% 50%',
    mobileCrop: 'subject-right',
  },
  {
    assetId: 'SYS_RECIPES-hero',
    role: 'collection-editorial-hero',
    path: 'src/assets/media/system/recipes-index-master.jpg',
    sourceRecord: 'SYS_RECIPES',
    promptBasis:
      'Complete Korean barbecue table showing the six recipe-library sections without unsafe raw/cooked contact',
    altText:
      'A complete Korean barbecue table with grilled dishes, banchan, greens, sauces, and dessert.',
    caption: 'Six sections, composed as one deliberate table.',
    focalPoint: '58% 50%',
    mobileCrop: 'subject-right',
  },
  {
    assetId: 'SYS_GUIDES-hero',
    role: 'collection-editorial-hero',
    path: 'src/assets/media/system/guides-index-master.jpg',
    sourceRecord: 'SYS_GUIDES',
    promptBasis:
      'Clean planning workspace with table map, thermometer, greens, and approved electric grill',
    altText:
      'A Korean barbecue planning table with a blank table map, thermometer, greens, and electric grill.',
    caption: 'Plan the room, table, work, and cleanup before service.',
    focalPoint: '60% 50%',
    mobileCrop: 'subject-right',
  },
  {
    assetId: 'SYS_MENUS-hero',
    role: 'collection-editorial-hero',
    path: 'src/assets/media/system/menus-index-master.jpg',
    sourceRecord: 'SYS_MENUS',
    promptBasis:
      'A balanced Korean barbecue menu staged for guest-count planning',
    altText:
      'A balanced Korean barbecue menu arranged around a stainless tabletop grill.',
    caption: 'A menu grows with appetite, capacity, and workload.',
    focalPoint: '58% 50%',
    mobileCrop: 'subject-right',
  },
  ...[
    [
      'G01',
      'A small first-night Korean barbecue table being calmly set by two adult friends.',
      'A calm first-night plan with clean raw and ready-to-eat zones.',
      'beginners-table',
    ],
    [
      'G02',
      'An indoor-approved electric grill near a window with clear space and a manual-ready setup.',
      'Setting and appliance approval come before atmosphere.',
      'indoor-outdoor-safety',
    ],
    [
      'G03',
      'A manufacturer-approved electric tabletop grill positioned with clear airflow and safe cord routing.',
      'A workable grill setup keeps heat, air, and traffic in view.',
      'grill-ventilation',
    ],
    [
      'G04',
      'Korean pantry staples in unmarked jars beside garlic, scallions, sesame, and dried chile.',
      'A label-first pantry built around real recipe needs.',
      'pantry',
    ],
    [
      'G05',
      'Evenly sliced Korean barbecue meat arranged on a chilled raw-food tray with separate clean tools.',
      'Cut, thickness, and method work together.',
      'meat-cuts',
    ],
    [
      'G06',
      'Fresh seafood on a chilled purchasing tray beside clean preparation tools and lemon.',
      'Species-aware buying, preparation, and grilling.',
      'seafood-buying',
    ],
    [
      'G07',
      'Fresh lettuce and perilla leaves being washed and dried for a clean ssam platter.',
      'Washed, dried greens ready for wrapping.',
      'ssam-greens',
    ],
    [
      'G08',
      'Three blank overhead table plans scaled for two, four, and eight Korean barbecue guests.',
      'Guest count changes quantity, appliance capacity, and workload.',
      'menu-scaling',
    ],
    [
      'G09',
      'A blank prep timeline beside labeled-by-shape containers and a safely cooled Korean barbecue table.',
      'A calm timeline protects the last hour before guests arrive.',
      'prep-timeline',
    ],
    [
      'G10',
      'An assortment of make-ahead banchan in covered cream ceramic dishes.',
      'Banchan variety with a manageable workload.',
      'banchan-planning',
    ],
    [
      'G11',
      'A cooled electric tabletop grill being cleaned with approved brushes and separate cloths.',
      'Cleanup begins only after safe shutdown and cooling.',
      'cleanup',
    ],
    [
      'G12',
      'Korean barbecue leftovers cooling in shallow covered containers beside a refrigerator shelf.',
      'Prompt cooling and clear leftovers planning.',
      'leftovers',
    ],
  ].map(([id, altText, caption, record], index) => ({
    assetId: `${id}-hero`,
    role: 'guide-editorial-hero',
    path: `src/assets/media/guides/${id.toLowerCase()}-master.jpg`,
    sourceRecord: id,
    promptBasis: `Subject-relevant editorial campaign frame for the ${record} guide`,
    altText,
    caption,
    focalPoint: index % 2 === 0 ? '58% 50%' : '54% 50%',
    mobileCrop: index % 2 === 0 ? 'subject-right' : 'center-safe',
  })),
  ...[
    ['MENU_2', 'two', 'two-guests'],
    ['MENU_4', 'four', 'four-guests'],
    ['MENU_8', 'eight', 'eight-guests'],
  ].map(([id, count, file]) => ({
    assetId: `${id}-hero`,
    role: 'menu-editorial-hero',
    path: `src/assets/media/menus/${file}-master.jpg`,
    sourceRecord: id,
    promptBasis: `Korean barbecue table visibly scaled to exactly ${count} place settings`,
    altText: `A Korean barbecue table arranged with exactly ${count} place settings.`,
    caption: `A balanced table and workload for ${count}.`,
    focalPoint: '50% 50%',
    mobileCrop: 'center-safe',
  })),
  ...[
    [
      'SYS_START',
      'start-here',
      'Friends setting a Korean barbecue table before guests gather.',
      'A welcoming place to begin planning the whole table.',
    ],
    [
      'SYS_TOOLS',
      'planning-tools',
      'A Korean barbecue planning workspace with an unmarked scale, thermometer, blank checklist, and ingredients.',
      'Quantities and timing stay connected to the real table.',
    ],
    [
      'SYS_SHOP',
      'shop',
      'A curated Korean barbecue equipment still life with a tabletop electric grill, thermometer, tongs, and cream ceramics.',
      'A preview collection held behind evidence and approval gates.',
    ],
    [
      'SYS_NEWSLETTER',
      'newsletter',
      'An adult editor writing on a blank cream page beside a warm Korean barbecue table.',
      'Editorial notes, held until consent and delivery systems exist.',
    ],
    [
      'SYS_CLASS',
      'live-class',
      'An adult instructor checking cooked food with a thermometer beside an approved electric tabletop grill.',
      'Instruction keeps safety cues adjacent to the action.',
    ],
    [
      'SYS_MEDIA_KIT',
      'media-kit',
      'Borderless Korean barbecue photographs and unmarked material swatches arranged on a charcoal studio table.',
      'A visual system for evidence-led partnership materials.',
    ],
    [
      'SYS_PARTNERSHIPS',
      'brand-partnerships',
      'Three adult collaborators reviewing blank packaging and Korean barbecue ingredients at a studio table.',
      'Fit, claims, and editorial independence before deliverables.',
    ],
    [
      'SYS_LICENSING',
      'licensing',
      'Korean barbecue photographs, blank archival sleeves, cotton gloves, and an unmarked metal storage case.',
      'Rights begin with a specific asset and a documented use.',
    ],
  ].map(([id, file, altText, caption]) => ({
    assetId: `${id}-hero`,
    role: 'system-editorial-hero',
    path: `src/assets/media/system/${file}-master.jpg`,
    sourceRecord: id,
    promptBasis: `Subject-specific editorial campaign frame for ${id}`,
    altText,
    caption,
    focalPoint: '58% 50%',
    mobileCrop: 'subject-right',
  })),
  {
    assetId: 'POLICY-tabletop-texture',
    role: 'policy-editorial-banner',
    path: 'src/assets/media/system/policy-tabletop-texture-master.jpg',
    sourceRecord: 'POLICY-pages',
    promptBasis:
      'Lightweight charcoal linen, brushed metal, cream ceramic, sesame, and scallion tabletop texture',
    altText: '',
    caption: 'KBBQGuide editorial policy artwork.',
    focalPoint: '50% 50%',
    mobileCrop: 'center-safe',
    altDecision: 'decorative',
  },
];

const editorialAssets = editorialAssetPlans.map(editorialAsset);

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

manifest.version = 4;
manifest.phase = 9;
manifest.status = 'implementation-screened-synthetic-hero-campaign-active';
manifest.generatedAt = generatedAt;
manifest.assets = [homeAsset, ...recipes.map(recipeAsset), ...editorialAssets];
manifest.notes =
  'Phase 9 activates implementation-screened synthetic editorial media for all recipe heroes and major visual entry points. Named human review remains required. Planned recipe process stills and videos remain honest placeholders.';
manifest.responsiveImageContract = {
  ...manifest.responsiveImageContract,
  formats: ['webp', 'jpeg'],
  requiredAspectRatios: ['3:2', '16:9', '4:3', '1:1'],
  widths: [360, 600, 960, 1200],
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
