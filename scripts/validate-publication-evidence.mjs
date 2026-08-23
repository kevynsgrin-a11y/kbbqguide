#!/usr/bin/env node
// Fail-closed publication evidence gate. This reads source records before the
// Astro build so no record can be promoted merely by changing a status field.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { argv, exit, stderr, stdout } from 'node:process';

const ROOT = resolve(import.meta.dirname, '..');

function optionValue(name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith('--'))
    throw new Error(`${name} requires a path value.`);
  return value;
}

const recipesDirectoryOption = optionValue('--recipes-dir');
const mediaManifestOption = optionValue('--media-manifest');
const RECIPES_DIR = resolve(
  ROOT,
  recipesDirectoryOption ?? 'src/content/recipes',
);
const MEDIA_MANIFEST = resolve(
  ROOT,
  mediaManifestOption ?? 'data/media-manifest.json',
);
const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const placeholderPattern =
  /\{\{[^}]+\}\}|^\s*(?:tbd|todo|unknown|n\/a|none|legal[ _-]?name)\s*$/i;
const reviewGateKeys = [
  'testCook',
  'foodSafety',
  'koreanLanguage',
  'editorial',
];
const legacyGateStatuses = {
  testCook: 'testCookStatus',
  foodSafety: 'foodSafetyReview',
  koreanLanguage: 'koreanLanguageReview',
  editorial: 'editorialReviewStatus',
};
const publicImageStatuses = new Set(['original-approved', 'licensed-approved']);
const allergenKeys = [
  'soy',
  'wheatGluten',
  'sesame',
  'fish',
  'shellfish',
  'egg',
  'dairy',
  'peanuts',
  'treeNuts',
  'alcohol',
];
const allergenPatterns = {
  soy: /\bsoy\b/i,
  wheatGluten: /\b(?:wheat|gluten|barley)\b/i,
  sesame: /\bsesame\b/i,
  fish: /\bfish\b/i,
  shellfish: /\b(?:shellfish|shrimp|prawn|crustacean|mollusk|molluscan)\b/i,
  egg: /\begg\b/i,
  dairy: /\b(?:dairy|milk|cream|butter|cheese|yogurt)\b/i,
  peanuts: /\bpeanut\b/i,
  treeNuts: /\b(?:tree nuts?|almond|walnut|pecan|cashew|pistachio|hazelnut)\b/i,
  alcohol: /\b(?:alcohol|wine|beer|soju|mirin|sake)\b/i,
};
const validationLimitations = [
  'Ingredient-to-instruction checks are lexical warnings because the schema has no step-level ingredient IDs.',
  'Temperature and storage source linkage is heuristic warning-only because the schema has no claim-to-source map.',
  'H1 uniqueness is derived from recipe.title because the schema has no separate H1 field.',
  'Social-image uniqueness compares approved source-media paths; Astro-generated derivative URLs are not available before build.',
  'Semantic similarity is a lexical Jaccard warning; the schema carries no editorial similarity assessment or embedding evidence.',
];

const issues = [];
const warnings = [];

function issue(file, message) {
  issues.push({ file, message });
}

function warning(file, message) {
  warnings.push({ file, message });
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isActualText(value) {
  return (
    typeof value === 'string' &&
    value.trim().length >= 2 &&
    !placeholderPattern.test(value.trim())
  );
}

function isIsoDate(value) {
  if (typeof value !== 'string') return false;
  const match = isoDatePattern.exec(value);
  if (!match) return false;
  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isHttpsUrl(value) {
  if (!isActualText(value)) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.hostname !== 'example.com'
    );
  } catch {
    return false;
  }
}

function hasProjectEvidenceFile(value) {
  if (!isActualText(value) || !/^[A-Za-z0-9._/-]+$/.test(value)) return false;
  const candidate = resolve(ROOT, value);
  const pathFromRoot = relative(ROOT, candidate);
  return (
    pathFromRoot !== '' &&
    !pathFromRoot.startsWith('..') &&
    !isAbsolute(pathFromRoot) &&
    existsSync(candidate) &&
    statSync(candidate).isFile()
  );
}

function isDurableEvidenceReference(value) {
  return isHttpsUrl(value) || hasProjectEvidenceFile(value);
}

function sourceUrls(value) {
  if (typeof value !== 'string') return [];
  return (value.match(/https:\/\/[^\s<>()[\]{}]+/g) ?? []).map((url) =>
    url.replace(/[.,;:]+$/, ''),
  );
}

function assertActualText(file, value, field) {
  if (!isActualText(value))
    issue(file, `${field} must be a real, non-placeholder value.`);
}

function assertIsoDate(file, value, field) {
  if (!isIsoDate(value))
    issue(file, `${field} must be a real ISO calendar date.`);
}

function validateReviewGate(file, record, gateKey) {
  const gate = record.reviewGates?.[gateKey];
  if (!isRecord(gate)) {
    issue(file, `${gateKey} needs an explicit human-review gate record.`);
    return;
  }

  if (record[legacyGateStatuses[gateKey]] !== 'approved')
    issue(
      file,
      `${legacyGateStatuses[gateKey]} must be approved with ${gateKey} evidence.`,
    );
  if (gate.status !== 'approved')
    issue(
      file,
      `${gateKey}.status must be approved before review or publication.`,
    );
  assertActualText(file, gate.reviewerName, `${gateKey}.reviewerName`);
  if (!isHttpsUrl(gate.reviewerProfileUrl))
    issue(
      file,
      `${gateKey}.reviewerProfileUrl must be a real HTTPS profile URL.`,
    );
  assertActualText(file, gate.reviewerRole, `${gateKey}.reviewerRole`);
  if (gateKey === 'foodSafety')
    assertActualText(
      file,
      gate.reviewerCredential,
      'foodSafety.reviewerCredential',
    );
  assertIsoDate(file, gate.reviewedAt, `${gateKey}.reviewedAt`);
  if (!isDurableEvidenceReference(gate.evidence))
    issue(
      file,
      `${gateKey}.evidence must be an existing project file or a real HTTPS record.`,
    );
}

function resolveActiveAsset(assetsById, assetId) {
  let asset = assetsById.get(assetId);
  const seen = new Set();
  while (asset?.status === 'replaced' && asset.replacedBy) {
    if (seen.has(asset.assetId)) return null;
    seen.add(asset.assetId);
    asset = assetsById.get(asset.replacedBy);
  }
  return asset ?? null;
}

function hasRequiredExternalLicense(asset) {
  return (
    asset.assetStatus !== 'licensed-approved' ||
    isActualText(asset.rights?.externalLicense)
  );
}

function validatePublishedHero(file, record, assetsById) {
  if (!Array.isArray(record.imageManifestIds)) {
    issue(file, 'Published recipes must declare imageManifestIds.');
    return;
  }

  const expectedHeroId = `${record.id}-hero`;
  if (!record.imageManifestIds.includes(expectedHeroId))
    issue(
      file,
      `Published recipes must declare their ${expectedHeroId} evidence asset.`,
    );

  for (const assetId of record.imageManifestIds) {
    const asset =
      isActualText(assetId) && resolveActiveAsset(assetsById, assetId);
    if (!asset)
      issue(
        file,
        `imageManifestIds contains an unresolved media asset: ${String(assetId)}.`,
      );
    else if (!hasRequiredExternalLicense(asset))
      issue(file, `${assetId} needs a license record before publication.`);
  }

  const hero = resolveActiveAsset(assetsById, expectedHeroId);
  if (!isRecord(hero)) {
    issue(file, `${expectedHeroId} is not a resolvable media-manifest record.`);
    return;
  }
  if (hero.status === 'replaced')
    issue(file, `${expectedHeroId} must resolve to an active media asset.`);
  if (hero.role !== 'finished-dish-hero')
    issue(file, `${expectedHeroId} must be a finished-dish hero.`);
  if (!publicImageStatuses.has(hero.assetStatus))
    issue(
      file,
      `${expectedHeroId} must be original-approved or licensed-approved.`,
    );
  if (hero.provenance?.sourceRecord !== record.id)
    issue(file, `${expectedHeroId} must be attributable to ${record.id}.`);
  if (hero.altDecision !== 'informative' || !isActualText(hero.altText))
    issue(
      file,
      `${expectedHeroId} needs informative, non-placeholder alt text.`,
    );
  if (hero.humanEditorialReview?.status !== 'approved')
    issue(
      file,
      `${expectedHeroId} requires explicit human editorial media approval.`,
    );
  return hero;
}

function isApprovedPublicRecipeMedia(asset, recipeId) {
  return (
    isRecord(asset) &&
    asset.status !== 'replaced' &&
    asset.role === 'finished-dish-hero' &&
    publicImageStatuses.has(asset.assetStatus) &&
    hasRequiredExternalLicense(asset) &&
    asset.provenance?.sourceRecord === recipeId &&
    asset.altDecision === 'informative' &&
    isActualText(asset.altText) &&
    asset.humanEditorialReview?.status === 'approved'
  );
}

function publicSocialImageAsset(record, assetsById) {
  if (!Array.isArray(record.imageManifestIds)) return null;

  return (
    record.imageManifestIds
      .map((assetId) => resolveActiveAsset(assetsById, assetId))
      .find(
        (asset) =>
          isApprovedPublicRecipeMedia(asset, record.id) &&
          /\bsocial\s+preview\b/i.test(asset.rights?.scope ?? ''),
      ) ?? null
  );
}

function durationMinutes(file, record, field) {
  const minutes = record[field]?.minutes;
  if (!Number.isInteger(minutes) || minutes < 0) {
    issue(file, `${field}.minutes must be a non-negative integer.`);
    return null;
  }
  return minutes;
}

function validateTimeArithmetic(file, record) {
  const prep = durationMinutes(file, record, 'prepTime');
  const marinate = durationMinutes(file, record, 'marinateTime');
  const cook = durationMinutes(file, record, 'cookTime');
  const rest = durationMinutes(file, record, 'restTime');
  const total = durationMinutes(file, record, 'totalTime');
  if ([prep, marinate, cook, rest, total].some((value) => value === null))
    return;

  const calculated = prep + marinate + cook + rest;
  if (total !== calculated)
    issue(
      file,
      `totalTime.minutes (${total}) must equal prep + marinate + cook + rest (${calculated}).`,
    );
}

const ingredientStopWords = new Set([
  'and',
  'for',
  'fresh',
  'korean',
  'large',
  'small',
  'medium',
  'optional',
  'toasted',
  'ground',
  'whole',
  'plain',
  'thin',
  'sliced',
  'chopped',
  'minced',
  'cut',
  'about',
]);

function lexicalTokens(value) {
  if (typeof value !== 'string') return [];
  return [
    ...new Set(
      (value.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
        (token) => token.length >= 3 && !ingredientStopWords.has(token),
      ),
    ),
  ];
}

function validateIngredientInstructionConsistency(file, record) {
  const instructionText = (
    Array.isArray(record.instructions) ? record.instructions : []
  )
    .filter(isRecord)
    .map((instruction) =>
      [
        instruction.heading,
        instruction.action,
        instruction.visualOrTactileCue,
        instruction.safetyNote,
      ]
        .filter((value) => typeof value === 'string')
        .join(' '),
    )
    .join(' ')
    .toLowerCase();
  const ingredients = (
    Array.isArray(record.ingredientGroups) ? record.ingredientGroups : []
  )
    .filter(isRecord)
    .flatMap((group) =>
      Array.isArray(group.ingredients) ? group.ingredients : [],
    )
    .filter(isRecord);

  if (instructionText.length === 0 || ingredients.length === 0) {
    issue(file, 'Published recipes need ingredient groups and instructions.');
    return;
  }

  for (const ingredient of ingredients) {
    const tokens = lexicalTokens(ingredient.item);
    if (
      tokens.length > 0 &&
      !tokens.some((token) => instructionText.includes(token))
    )
      warning(
        file,
        `ingredient↔instruction trace warning: "${ingredient.item}" has no lexical cue in the instructions.`,
      );
  }
}

function validateTemperatureAndStorageSourceLinkage(file, record) {
  const foodSafetyText = [
    record.targetInternalTemperature,
    ...(Array.isArray(record.foodSafetyNotes) ? record.foodSafetyNotes : []),
  ]
    .filter((value) => typeof value === 'string')
    .join(' ');
  const storageText = [
    record.storage,
    record.reheating,
    record.leftovers,
    ...(Array.isArray(record.foodSafetyNotes) ? record.foodSafetyNotes : []),
  ]
    .filter((value) => typeof value === 'string')
    .join(' ');
  const sourceText = (
    Array.isArray(record.sourcesAndEditorialNotes)
      ? record.sourcesAndEditorialNotes
      : []
  )
    .filter((value) => typeof value === 'string')
    .join(' ');
  const hasTemperatureClaim =
    /\b\d{1,3}\s*°?\s*[fc]\b|\b(?:internal|safe[- ]?minimum) temperature\b/i.test(
      foodSafetyText,
    );
  const hasStorageClaim =
    /\b(?:storage|refrigerat|freeze|leftover|keep cold|cold hold)\b/i.test(
      storageText,
    );
  const hasTemperatureSourceCue =
    /\b(?:temperature|thermometer|internal|food[ -]?safety|foodsafety|usda|fda)\b/i.test(
      sourceText,
    );
  const hasStorageSourceCue =
    /\b(?:storage|refrigerat|freeze|leftover|food[ -]?safety|foodsafety|usda|fda)\b/i.test(
      sourceText,
    );

  if (hasTemperatureClaim && !hasTemperatureSourceCue)
    warning(
      file,
      'temperature source-linkage warning: a temperature claim has no discernible safety-source cue in sourcesAndEditorialNotes.',
    );
  if (hasStorageClaim && !hasStorageSourceCue)
    warning(
      file,
      'storage source-linkage warning: a storage claim has no discernible safety-source cue in sourcesAndEditorialNotes.',
    );
}

function directAllergensFromNotes(record) {
  const directAllergens = new Set();
  const ingredients = (
    Array.isArray(record.ingredientGroups) ? record.ingredientGroups : []
  )
    .filter(isRecord)
    .flatMap((group) =>
      Array.isArray(group.ingredients) ? group.ingredients : [],
    )
    .filter(isRecord);

  for (const ingredient of ingredients) {
    const notes = Array.isArray(ingredient.allergenNotes)
      ? ingredient.allergenNotes
      : [];
    for (const note of notes) {
      if (typeof note !== 'string') continue;
      const leadStatement = note.split(/[;,]/, 1)[0] ?? '';
      if (
        /^\s*(?:may|might|verify|check|facility|contains traces)/i.test(
          leadStatement,
        )
      )
        continue;
      for (const key of allergenKeys) {
        if (allergenPatterns[key].test(leadStatement)) directAllergens.add(key);
      }
    }
  }

  return { directAllergens, ingredients };
}

function validateAllergenReconciliation(file, record) {
  if (!isRecord(record.allergens)) {
    issue(file, 'Published recipes need an allergen declaration object.');
    return;
  }

  const { directAllergens, ingredients } = directAllergensFromNotes(record);
  for (const key of directAllergens) {
    if (record.allergens[key] !== true)
      issue(
        file,
        `allergens.${key} must be true because an ingredient allergen note declares it directly.`,
      );
  }

  const reconciliationText = [
    record.allergens.crossContactWarning,
    ...ingredients.flatMap((ingredient) => ingredient.allergenNotes ?? []),
  ]
    .filter((value) => typeof value === 'string')
    .join(' ');
  for (const key of allergenKeys) {
    if (
      record.allergens[key] === true &&
      !allergenPatterns[key].test(reconciliationText)
    )
      warning(
        file,
        `allergen reconciliation warning: allergens.${key} is true but has no matching ingredient note or cross-contact text.`,
      );
  }
}

function validateRelatedIdentifiers(file, record, recipesById) {
  for (const field of ['relatedRecipeIds', 'menuPairings']) {
    const ids = record[field];
    if (!Array.isArray(ids)) {
      issue(file, `${field} must be an array of recipe IDs.`);
      continue;
    }
    const seen = new Set();
    for (const id of ids) {
      if (!isActualText(id)) {
        issue(file, `${field} contains an invalid recipe ID.`);
        continue;
      }
      if (id === record.id)
        issue(file, `${field} must not reference the recipe itself (${id}).`);
      if (!recipesById.has(id))
        issue(file, `${field} references unknown recipe ID ${id}.`);
      if (seen.has(id))
        issue(file, `${field} contains duplicate recipe ID ${id}.`);
      seen.add(id);
    }
  }
}

function validateReleaseTimeChecks(file, record, assetsById, recipesById) {
  validateTimeArithmetic(file, record);
  validateIngredientInstructionConsistency(file, record);
  validateTemperatureAndStorageSourceLinkage(file, record);
  validateAllergenReconciliation(file, record);
  validateRelatedIdentifiers(file, record, recipesById);

  return publicSocialImageAsset(record, assetsById);
}

function validateRecipe(file, record, assetsById, recipesById) {
  if (!isRecord(record)) {
    issue(file, 'Recipe source must be a JSON object.');
    return;
  }
  if (record.contentStatus !== 'complete') {
    issue(
      file,
      'Publication evidence validation accepts complete recipe records only.',
    );
    return;
  }
  if (!['draft', 'reviewed', 'published'].includes(record.editorialStatus)) {
    issue(file, 'editorialStatus must be draft, reviewed, or published.');
    return;
  }

  assertActualText(file, record.id, 'id');
  assertActualText(file, record.title, 'title');
  assertActualText(file, record.shortDescription, 'shortDescription');
  assertActualText(file, record.primaryKeyword, 'primaryKeyword');
  assertIsoDate(file, record.createdAt, 'createdAt');
  assertIsoDate(file, record.updatedAt, 'updatedAt');
  if (
    isIsoDate(record.createdAt) &&
    isIsoDate(record.updatedAt) &&
    record.updatedAt < record.createdAt
  )
    issue(file, 'updatedAt cannot precede createdAt.');
  if (!isHttpsUrl(record.canonicalUrl))
    issue(file, 'canonicalUrl must be a real HTTPS URL.');

  const notes = record.sourcesAndEditorialNotes;
  if (!Array.isArray(notes) || notes.length === 0) {
    issue(
      file,
      'sourcesAndEditorialNotes must contain at least one source record.',
    );
  } else if (!notes.some((note) => sourceUrls(note).some(isHttpsUrl))) {
    issue(
      file,
      'sourcesAndEditorialNotes must include at least one real HTTPS source URL.',
    );
  }

  if (record.editorialStatus === 'draft') return;

  for (const gateKey of reviewGateKeys)
    validateReviewGate(file, record, gateKey);

  if (record.editorialStatus === 'reviewed') {
    if (record.publishedAt !== null && record.publishedAt !== undefined)
      issue(
        file,
        'Reviewed but unpublished recipes must not carry publishedAt.',
      );
    return;
  }

  assertActualText(file, record.author, 'author');
  if (!isHttpsUrl(record.authorProfileUrl))
    issue(file, 'authorProfileUrl must be a real HTTPS profile URL.');
  assertIsoDate(file, record.publishedAt, 'publishedAt');
  assertIsoDate(file, record.materiallyUpdatedAt, 'materiallyUpdatedAt');
  if (
    isIsoDate(record.createdAt) &&
    isIsoDate(record.publishedAt) &&
    record.publishedAt < record.createdAt
  )
    issue(file, 'publishedAt cannot precede createdAt.');
  if (
    isIsoDate(record.createdAt) &&
    isIsoDate(record.materiallyUpdatedAt) &&
    record.materiallyUpdatedAt < record.createdAt
  )
    issue(file, 'materiallyUpdatedAt cannot precede createdAt.');
  validatePublishedHero(file, record, assetsById);
  return {
    file,
    record,
    socialImage: validateReleaseTimeChecks(
      file,
      record,
      assetsById,
      recipesById,
    ),
  };
}

function validateUniquePublicField(
  publishedRecords,
  label,
  valueFor,
  normalize = (value) => value.trim().toLowerCase(),
) {
  const recordsByValue = new Map();
  for (const entry of publishedRecords) {
    const value = valueFor(entry);
    if (!isActualText(value)) {
      issue(entry.file, `Published recipes require a public ${label}.`);
      continue;
    }
    const normalized = normalize(value);
    const matches = recordsByValue.get(normalized) ?? [];
    matches.push(entry);
    recordsByValue.set(normalized, matches);
  }

  for (const matches of recordsByValue.values()) {
    if (matches.length < 2) continue;
    const files = matches.map((entry) => entry.file).join(', ');
    for (const entry of matches)
      issue(entry.file, `Duplicate public ${label}; also used by ${files}.`);
  }
}

const semanticStopWords = new Set([
  'and',
  'the',
  'with',
  'for',
  'from',
  'that',
  'this',
  'your',
  'guide',
  'recipe',
  'korean',
  'barbecue',
  'kbbq',
  'how',
  'to',
  'in',
  'of',
  'a',
  'an',
]);

function semanticTokens(record) {
  return new Set(
    [
      record.title,
      record.shortDescription,
      record.seoTitle,
      record.metaDescription,
    ]
      .filter((value) => typeof value === 'string')
      .join(' ')
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((token) => token.length >= 3 && !semanticStopWords.has(token)) ??
      [],
  );
}

function lexicalJaccard(left, right) {
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 0;
  const intersection = [...left].filter((token) => right.has(token));
  return intersection.length / union.size;
}

function validatePublicCollection(publishedRecords) {
  validateUniquePublicField(
    publishedRecords,
    'page title',
    (entry) => entry.record.seoTitle,
  );
  validateUniquePublicField(
    publishedRecords,
    'meta description',
    (entry) => entry.record.metaDescription,
  );
  validateUniquePublicField(
    publishedRecords,
    'canonical URL',
    (entry) => entry.record.canonicalUrl,
    (value) => value.trim(),
  );
  validateUniquePublicField(
    publishedRecords,
    'H1 (derived from recipe.title)',
    (entry) => entry.record.title,
  );
  validateUniquePublicField(
    publishedRecords.filter((entry) => entry.socialImage !== null),
    'social image',
    (entry) => entry.socialImage?.path ?? null,
    (value) => value.trim(),
  );

  for (let leftIndex = 0; leftIndex < publishedRecords.length; leftIndex += 1) {
    const left = publishedRecords[leftIndex];
    if (!left) continue;
    const leftTokens = semanticTokens(left.record);
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < publishedRecords.length;
      rightIndex += 1
    ) {
      const right = publishedRecords[rightIndex];
      if (!right) continue;
      const score = lexicalJaccard(leftTokens, semanticTokens(right.record));
      if (score >= 0.72)
        warning(
          left.file,
          `semantic-similarity warning: ${left.file} and ${right.file} share ${(score * 100).toFixed(0)}% lexical overlap; editorial comparison is required.`,
        );
    }
  }
}

const manifest = JSON.parse(readFileSync(MEDIA_MANIFEST, 'utf8'));
const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
const assetsById = new Map(
  assets.filter(isRecord).map((asset) => [asset.assetId, asset]),
);
const recipeFiles = readdirSync(RECIPES_DIR)
  .filter((file) => file.endsWith('.json'))
  .sort();
const recipeEntries = [];

for (const file of recipeFiles) {
  const path = resolve(RECIPES_DIR, file);
  try {
    recipeEntries.push({
      file,
      record: JSON.parse(readFileSync(path, 'utf8')),
    });
  } catch (error) {
    issue(
      file,
      `could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const recipesById = new Map();
for (const entry of recipeEntries) {
  if (!isRecord(entry.record) || !isActualText(entry.record.id)) continue;
  if (recipesById.has(entry.record.id))
    issue(entry.file, `Duplicate recipe ID ${entry.record.id}.`);
  else recipesById.set(entry.record.id, entry);
}

const publishedRecords = recipeEntries
  .map((entry) =>
    validateRecipe(entry.file, entry.record, assetsById, recipesById),
  )
  .filter(Boolean);

validatePublicCollection(publishedRecords);

function writeWarnings() {
  if (warnings.length === 0) return;
  stderr.write('publication-evidence — WARNINGS (non-blocking).\n\n');
  for (const finding of warnings)
    stderr.write(`  ${finding.file}: ${finding.message}\n`);
  stderr.write('\n');
}

const summary = {
  recipeFiles: recipeFiles.length,
  publishedRecipes: publishedRecords.length,
  issues: issues.length,
  warnings: warnings.length,
  limitations: validationLimitations,
};

if (issues.length > 0) {
  writeWarnings();
  stderr.write('publication-evidence — FAILED.\n\n');
  for (const finding of issues)
    stderr.write(`  ${finding.file}: ${finding.message}\n`);
  stderr.write(`\n${JSON.stringify(summary)}\n`);
  exit(1);
}

writeWarnings();
stdout.write(`publication-evidence — clean. ${JSON.stringify(summary)}\n`);
