#!/usr/bin/env node
/**
 * Build the ingredient nutrition reference data from the TrueAPI portfolio
 * ingredient dictionary (USDA FoodData Central values, resolved offline).
 *
 * Inputs:
 *   - data/ingredient-canonical.json  (item string -> canonical id, the site's
 *     existing identity map used by shopping-list consolidation)
 *   - The portfolio dictionary, resolved via DICTIONARY_PATH (env) or argv[2],
 *     defaulting to the committed subset copy data/ingredient-dictionary.json.
 *     Shape: { bundle, source, fetchedAt, counts, entries: { [normalized]: {
 *     display, sites, resolved, fdcId?, name?, dataType?, confidence?,
 *     per100g? } } }
 *
 * Outputs:
 *   - data/ingredient-nutrition.json: one entry per canonical id, carrying the
 *     best-resolved FDC match (highest confidence, then most nutrients), full
 *     per-100 g nutrient set, per-entry provenance (fdcId, dataType,
 *     confidence), a dictionaryFetchedAt stamp, and coverage counts.
 *   - When the dictionary is read from a non-default path, the committed
 *     subset copy data/ingredient-dictionary.json is also refreshed so both
 *     artifacts stay in sync.
 *
 * Refresh one-liner (after the portfolio bundle grows):
 *   DICTIONARY_PATH=<path-to-updated-bundle> node scripts/build-ingredient-nutrition.mjs
 *
 * Unresolved canonical ids are kept with resolved:false and no per100g data —
 * the site must never render invented nutrition for them.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalPath = resolve(repoRoot, 'data', 'ingredient-canonical.json');
const subsetPath = resolve(repoRoot, 'data', 'ingredient-dictionary.json');
const outputPath = resolve(repoRoot, 'data', 'ingredient-nutrition.json');

const dictionaryPath = resolve(
  repoRoot,
  process.env.DICTIONARY_PATH ||
    process.argv[2] ||
    'data/ingredient-dictionary.json',
);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const canonical = readJson(canonicalPath);
const dictionary = readJson(dictionaryPath);
if (!dictionary || typeof dictionary !== 'object' || !dictionary.entries) {
  throw new Error(`Dictionary at ${dictionaryPath} has no entries object`);
}

const itemStrings = Object.keys(canonical.map);
const dictKeys = Object.keys(dictionary.entries);
const dictByLower = new Map(dictKeys.map((key) => [key.toLowerCase(), key]));

/** Look a recipe item string up in the dictionary (exact key, then case-insensitive). */
function lookupDictionaryEntry(item) {
  const entries = dictionary.entries;
  if (Object.hasOwn(entries, item)) return { key: item, entry: entries[item] };
  const lowerKey = dictByLower.get(item.toLowerCase());
  if (lowerKey) return { key: lowerKey, entry: entries[lowerKey] };
  return null;
}

function nutrientCount(per100g) {
  return per100g ? Object.keys(per100g).length : 0;
}

/** Rank matches: resolved first, then confidence, then richer per100g payloads. */
function betterMatch(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (Boolean(a.entry.resolved) !== Boolean(b.entry.resolved)) {
    return a.entry.resolved ? a : b;
  }
  if (a.entry.confidence !== b.entry.confidence) {
    return (a.entry.confidence ?? 0) > (b.entry.confidence ?? 0) ? a : b;
  }
  const nutrients =
    nutrientCount(a.entry.per100g) - nutrientCount(b.entry.per100g);
  if (nutrients !== 0) return nutrients > 0 ? a : b;
  return a.key < b.key ? a : b;
}

// Join item strings -> canonical id -> best dictionary entry.
const byCanonicalId = new Map();
const unmatched = [];
const usedDictKeys = new Set();
for (const item of itemStrings) {
  const id = canonical.map[item].id;
  const match = lookupDictionaryEntry(item);
  if (!match) {
    unmatched.push(item);
    continue;
  }
  usedDictKeys.add(match.key);
  const current = byCanonicalId.get(id);
  byCanonicalId.set(id, {
    displayName: canonical.map[item].displayName,
    sourceItems: [...(current?.sourceItems ?? []), item].sort(),
    match: betterMatch(current?.match, match),
  });
}

const ingredients = {};
let resolvedCount = 0;
for (const id of [...byCanonicalId.keys()].sort()) {
  const { displayName, sourceItems, match } = byCanonicalId.get(id);
  const { resolved, fdcId, name, dataType, confidence, per100g } = match.entry;
  if (resolved) resolvedCount += 1;
  ingredients[id] = {
    displayName,
    sourceItems,
    resolved: Boolean(resolved),
    ...(resolved
      ? {
          fdcId: fdcId ?? null,
          fdcName: name ?? null,
          dataType: dataType ?? null,
          confidence: confidence ?? null,
          // Copy only the nutrients the dictionary actually carries.
          per100g: per100g ? { ...per100g } : {},
        }
      : {}),
  };
}

const output = {
  version: 1,
  generatedBy: 'scripts/build-ingredient-nutrition.mjs',
  dictionarySource:
    dictionary.source ?? 'TrueAPI portfolio ingredient dictionary',
  dictionaryFetchedAt: dictionary.fetchedAt ?? null,
  fdcAttribution: {
    text: 'Nutrition data: USDA FoodData Central',
    url: 'https://fdc.nal.usda.gov',
  },
  note: 'Per-100 g reference values for raw ingredients from USDA FoodData Central via the TrueAPI portfolio ingredient dictionary. These are reference values, not a per-serving analysis of any recipe. Entries with resolved:false have no verified FDC match yet and carry no nutrition data by design.',
  counts: {
    canonicalIds: Object.keys(ingredients).length,
    dictionaryEntriesMatched: usedDictKeys.size,
    resolved: resolvedCount,
    unresolved: Object.keys(ingredients).length - resolvedCount,
  },
  ingredients,
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

// Keep the committed subset copy in sync when reading an external bundle.
if (dictionaryPath !== subsetPath) {
  const subsetEntries = {};
  for (const key of [...usedDictKeys].sort())
    subsetEntries[key] = dictionary.entries[key];
  const subset = {
    bundle: dictionary.bundle ?? null,
    source: dictionary.source ?? 'TrueAPI portfolio ingredient dictionary',
    fetchedAt: dictionary.fetchedAt ?? null,
    note: `Subset of the TrueAPI portfolio ingredient dictionary filtered to the ${itemStrings.length} distinct item strings in data/ingredient-canonical.json (kbbqguide only). Regenerated by scripts/build-ingredient-nutrition.mjs whenever DICTIONARY_PATH points at an updated full bundle.`,
    counts: {
      entries: Object.keys(subsetEntries).length,
    },
    entries: subsetEntries,
  };
  writeFileSync(subsetPath, `${JSON.stringify(subset, null, 2)}\n`, 'utf8');
}

console.log(
  `Wrote ${outputPath}: ${output.counts.canonicalIds} canonical ids, ` +
    `${output.counts.resolved} resolved, ${output.counts.unresolved} unresolved` +
    (unmatched.length
      ? `, unmatched item strings: ${unmatched.join(', ')}`
      : '') +
    (dictionaryPath !== subsetPath
      ? `; refreshed subset at ${subsetPath}`
      : ''),
);
