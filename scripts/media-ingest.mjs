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
// Responsive derivatives (WebP plus JPEG fallback, widths 360-1600) are emitted by the build
// pipeline (`astro build` via <Picture>) from the master this command installs;
// see docs/media-briefs/phase-10/README.md. This command never marks an asset
// human-approved; approval is operator-only (Phase 10.6 workbench).

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
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
if (size.width !== expected.width || size.height !== expected.height)
  problems.push(
    `dimensions ${size.width}x${size.height} != required ${expected.width}x${expected.height}`,
  );
if (actualRatio !== expected.ratio)
  problems.push(`aspect ratio ${actualRatio} != required ${expected.ratio}`);
if (problems.length) fail(`validation failed:\n  - ${problems.join('\n  - ')}`);

// --- Compute new id + path ----------------------------------------------------
function nextRevisionId(base) {
  const ids = new Set(manifest.assets.map((a) => a.assetId));
  let n = 1;
  let candidate = `${base}-r${n}`;
  while (ids.has(candidate)) candidate = `${base}-r${++n}`;
  return candidate;
}
const newId = explicitId || nextRevisionId(oldId);
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
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
stdout.write(`media:ingest — OK\n${JSON.stringify(summary, null, 2)}\n`);
