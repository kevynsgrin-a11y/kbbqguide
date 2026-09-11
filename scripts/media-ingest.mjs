#!/usr/bin/env node
// Phase 10.4 media ingest. Validates a regenerated hero image against the brief
// (dimensions / format / aspect ratio inherited from the asset it supersedes),
// then registers a NEW immutable manifest entry (fresh id, humanEditorialReview
// required) and marks the superseded entry status:"replaced", replacedBy:<newId>.
//
// Usage:
//   npm run media:ingest -- <file> --supersedes <oldId> [--id <newId>] [--role <role>]
//                            [--date YYYY-MM-DD] [--dry-run] [--manifest <path>]
//
// Responsive derivatives (WebP plus JPEG only, widths 360/600/960/1200) are
// emitted by the `astro build` pipeline from the master this command installs;
// see docs/media-briefs/phase-10/README.md. This command never marks an asset
// human-approved; approval is operator-only (Phase 10.6 workbench).

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { argv, exit, stderr, stdout } from 'node:process';

function arg(name) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
const flag = (name) => argv.includes(`--${name}`);

const file = argv[2] && !argv[2].startsWith('--') ? argv[2] : undefined;
const oldId = arg('supersedes');
const explicitId = arg('id');
const explicitRole = arg('role');
const dryRun = flag('dry-run');
const manifestPath = arg('manifest') || 'data/media-manifest.json';
const ingestDate = arg('date') || new Date().toISOString().slice(0, 10);
// An explicit original + metadata pair is required for native-size photo imports.
// The historical same-size replacement contract remains the default.
const originalPath = arg('original');
const metadataPath = arg('metadata');
if (Boolean(originalPath) !== Boolean(metadataPath))
  fail('--original and --metadata must be supplied together');

function fail(msg) {
  stderr.write(`media:ingest — ERROR: ${msg}\n`);
  exit(1);
}

if (!file) fail('missing <file> argument');
if (!oldId) fail('missing --supersedes <oldId>');
if (!existsSync(file)) fail(`file not found: ${file}`);

// --- Minimal JPEG dimension + format reader (no external deps) ----------------
function readJpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null; // SOI
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF markers carrying frame dimensions.
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return null;
}

const ext = path.extname(file).toLowerCase();
if (ext !== '.jpg' && ext !== '.jpeg')
  fail(`expected a .jpg/.jpeg master, got ${ext}`);
const buf = readFileSync(file);
const size = readJpegSize(buf);
if (!size) fail('could not read JPEG dimensions (is this a valid JPEG?)');

// --- Load manifest and the superseded entry -----------------------------------
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const oldAsset = manifest.assets.find((a) => a.assetId === oldId);
if (!oldAsset) fail(`--supersedes id not in manifest: ${oldId}`);
if (oldAsset.status === 'replaced')
  fail(
    `${oldId} is already replaced by ${oldAsset.replacedBy || 'an unknown asset'}; supersede the current active asset instead`,
  );

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
function ratioString(w, h) {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

const expected = {
  width: oldAsset.width,
  height: oldAsset.height,
  ratio: oldAsset.aspectRatio,
};
const actualRatio = ratioString(size.width, size.height);
const problems = [];
let photoMetadata;
if (originalPath && metadataPath) {
  if (explicitRole && explicitRole !== 'finished-dish-hero')
    fail('native finished-dish photo cannot be assigned an instructional role');
  const original = readFileSync(originalPath);
  photoMetadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
  const originalSize = original
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? { width: original.readUInt32BE(16), height: original.readUInt32BE(20) }
    : readJpegSize(original);
  if (!originalSize || originalSize.width < 600 || originalSize.height < 600)
    fail('original must be a decodable PNG/JPEG at least 600 pixels per side');
  if (size.width !== originalSize.width || size.height !== originalSize.height)
    fail(
      'native photo master must preserve original dimensions without upscaling or cropping',
    );
  if (
    photoMetadata.sourceImport?.sha256 !==
    createHash('sha256').update(original).digest('hex')
  )
    fail('original checksum does not match import evidence');
  if (
    photoMetadata.provenance?.sourceRecord !== oldAsset.provenance.sourceRecord
  )
    fail('photo sourceRecord must match the exact replaced recipe');
  if (oldAsset.role !== 'finished-dish-hero')
    fail('native photo import requires a recipe hero slot');
  for (const field of ['altText', 'caption', 'credit'])
    if (
      typeof photoMetadata[field] !== 'string' ||
      photoMetadata[field].length < 20
    )
      fail(`missing descriptive ${field}`);
  if (!/AI-generated/i.test(photoMetadata.provenance?.disclosure ?? ''))
    fail('synthetic photo import requires an AI-generated disclosure');
  if (
    !photoMetadata.provenance?.creator ||
    !photoMetadata.provenance?.promptBasis
  )
    fail('photo provenance is incomplete');
  if (!photoMetadata.rights?.source || !photoMetadata.rights?.scope)
    fail('photo rights evidence is incomplete');
  photoMetadata.sourceImport = {
    ...photoMetadata.sourceImport,
    width: originalSize.width,
    height: originalSize.height,
    masterSha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
    transform: 'native-dimensions-jpeg-no-crop-no-upscale',
  };
}
if (
  !photoMetadata &&
  (size.width !== expected.width || size.height !== expected.height)
)
  problems.push(
    `dimensions ${size.width}x${size.height} != required ${expected.width}x${expected.height}`,
  );
if (!photoMetadata && actualRatio !== expected.ratio)
  problems.push(`aspect ratio ${actualRatio} != required ${expected.ratio}`);
if (problems.length) fail(`validation failed:\n  - ${problems.join('\n  - ')}`);

// --- Compute new id + path ----------------------------------------------------
function nextRevisionId(base) {
  base = base.replace(/(?:-r\d+)+$/, '');
  const ids = new Set(manifest.assets.map((a) => a.assetId));
  let n = 1;
  let candidate = `${base}-r${n}`;
  while (ids.has(candidate)) candidate = `${base}-r${++n}`;
  return candidate;
}
const newId = explicitId || nextRevisionId(oldId);
if (!/^[A-Za-z0-9_-]+$/.test(newId)) fail('invalid asset id');
if (manifest.assets.some((asset) => asset.assetId === newId))
  fail(`duplicate asset id: ${newId}`);
const dir = path.dirname(oldAsset.path);
const oldBase = path.basename(oldAsset.path, path.extname(oldAsset.path));
const newPath = path.join(dir, `${oldBase}-${newId}.jpg`).replaceAll('\\', '/');

const newAsset = {
  ...structuredClone(oldAsset),
  assetId: newId,
  path: newPath,
  width: size.width,
  height: size.height,
  aspectRatio: actualRatio,
  role: explicitRole || oldAsset.role,
  supersedes: oldId,
  ingestedBy: 'phase-10-agent',
  ingestedDate: ingestDate,
  altText:
    `New ${oldId} replacement pending review — see docs/media-briefs/phase-10/. ${oldAsset.altText}`.slice(
      0,
      300,
    ),
  provenance: {
    ...oldAsset.provenance,
    generatedAt: ingestDate,
    promptBasis: `Replacement for ${oldId}; acceptance brief in docs/media-briefs/phase-10/`,
  },
  qa: {
    ...oldAsset.qa,
    humanEditorialReview: 'required',
    reviewer: 'phase-10-agent; new asset, human sign-off not inferred',
  },
  humanEditorialReview: {
    status: 'required',
    lanes: Object.fromEntries(
      ['food', 'safety', 'cultural', 'accessibility', 'brand'].map((lane) => [
        lane,
        { decision: '', reviewer: '', date: '', notes: '' },
      ]),
    ),
  },
};
delete newAsset.phase10Proposal;
delete newAsset.status;
delete newAsset.replacedBy;
if (photoMetadata) {
  // Copy only image-specific fields. Never inherit the old creator, rights,
  // crop decisions, review proposals, or implementation screening claims.
  Object.assign(newAsset, {
    assetStatus: 'synthetic-labeled',
    altDecision: 'informative',
    altText: photoMetadata.altText,
    caption: photoMetadata.caption,
    credit: photoMetadata.credit,
    provenance: photoMetadata.provenance,
    rights: photoMetadata.rights,
    sourceImport: photoMetadata.sourceImport,
    focalPoint: '50% 50%',
    mobileCrop: 'center-safe',
    imageFit: 'contain',
    ingestedBy: 'codex-photo-integration-agent',
    qa: {
      implementationVisualReview: 'matched-to-recipe-by-agent',
      implementationFoodSafetyScreen: 'image-is-not-evidence-of-doneness',
      implementationCulturalAndIngredientScreen:
        'visual-match-only-human-review-required',
      responsiveCropReview: 'full-frame-no-crop',
      humanEditorialReview: 'required',
      reviewer: 'Codex photo integration agent; human sign-off not inferred',
    },
  });
}

const summary = {
  supersedes: oldId,
  newId,
  newPath,
  dimensions: `${size.width}x${size.height}`,
  aspectRatio: actualRatio,
  dryRun,
};

if (dryRun) {
  stdout.write(
    `media:ingest — DRY RUN OK\n${JSON.stringify(summary, null, 2)}\n`,
  );
  exit(0);
}

// --- Write: install master, register new entry, mark old replaced -------------
copyFileSync(file, newPath);
oldAsset.status = 'replaced';
oldAsset.replacedBy = newId;
manifest.assets.push(newAsset);
const recipePlan = manifest.recipePlans?.find(
  (plan) => plan.recipeId === newAsset.provenance.sourceRecord,
);
if (recipePlan && newAsset.role === 'finished-dish-hero') {
  const stableId = recipePlan.hero.assetId;
  for (const key of [
    'path',
    'width',
    'height',
    'aspectRatio',
    'assetStatus',
    'focalPoint',
    'mobileCrop',
    'altDecision',
    'altText',
    'caption',
    'credit',
    'provenance',
    'rights',
    'qa',
  ])
    recipePlan.hero[key] = structuredClone(newAsset[key]);
  recipePlan.hero.assetId = stableId;
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
stdout.write(`media:ingest — OK\n${JSON.stringify(summary, null, 2)}\n`);
