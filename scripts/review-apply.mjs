#!/usr/bin/env node
// Phase 10.6 review:apply. Merges an exported review/decisions.json into the
// media manifest: records each asset's five review lanes, rolls the per-asset
// humanEditorialReview.status up from the lane decisions, and applies APPROVED
// alt text (accessibility lane = approve) to the live manifest altText/altDecision.
// Refuses to run if any active asset has an undecided lane unless --partial.
//
// Usage:
//   npm run review:apply -- review/decisions.json [--partial] [--dry-run]
//                            [--manifest <path>]
//
// The operator runs this (Phase 10.7). Agents build and dry-run it only.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { argv, exit, stderr, stdout } from 'node:process';

const LANES = ['food', 'safety', 'cultural', 'accessibility', 'brand'];

function arg(name) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
const flag = (name) => argv.includes(`--${name}`);

const decisionsPath =
  argv[2] && !argv[2].startsWith('--') ? argv[2] : undefined;
const partial = flag('partial');
const dryRun = flag('dry-run');
const manifestPath = arg('manifest') || 'data/media-manifest.json';

function fail(msg) {
  stderr.write(`review:apply — ERROR: ${msg}\n`);
  exit(1);
}
if (!decisionsPath) fail('missing <decisions.json> argument');
if (!existsSync(decisionsPath))
  fail(`decisions file not found: ${decisionsPath}`);

const decisions = JSON.parse(readFileSync(decisionsPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const byId = new Map((decisions.assets || []).map((d) => [d.assetId, d]));

// Active assets = not already superseded/replaced.
const active = manifest.assets.filter((a) => a.status !== 'replaced');

// Validate lane completeness.
const undecided = [];
for (const asset of active) {
  const d = byId.get(asset.assetId);
  if (!d) {
    undecided.push(`${asset.assetId} (no decision record)`);
    continue;
  }
  for (const lane of LANES) {
    if (!d.lanes?.[lane]?.decision) undecided.push(`${asset.assetId}:${lane}`);
  }
}
if (undecided.length && !partial)
  fail(
    `${undecided.length} undecided lane(s); pass --partial to apply anyway.\n  ${undecided.slice(0, 20).join('\n  ')}${undecided.length > 20 ? '\n  ...' : ''}`,
  );

function rollupStatus(lanes) {
  const decisions = LANES.map((l) => lanes[l]?.decision || '');
  if (decisions.some((d) => d === 'reject')) return 'rejected';
  if (decisions.some((d) => d === 'replace')) return 'replaced';
  if (decisions.every((d) => d === 'approve')) return 'approved';
  return 'required';
}

let updated = 0;
let altApplied = 0;
const applied = [];
for (const asset of active) {
  const d = byId.get(asset.assetId);
  if (!d) continue;
  asset.humanEditorialReview = asset.humanEditorialReview || {
    status: 'required',
    lanes: {},
  };
  for (const lane of LANES) {
    const src = d.lanes?.[lane] || {};
    asset.humanEditorialReview.lanes[lane] = {
      decision: src.decision || '',
      reviewer: src.reviewer || '',
      date: src.date || '',
      notes: src.notes || '',
    };
  }
  asset.humanEditorialReview.status = rollupStatus(
    asset.humanEditorialReview.lanes,
  );
  asset.humanEditorialReview.appliedBy = decisions.exportedBy || 'operator';
  asset.humanEditorialReview.appliedFrom = decisionsPath;

  // Apply approved alt text (the accessibility lane certifies alt).
  if (asset.humanEditorialReview.lanes.accessibility.decision === 'approve') {
    if (d.altDecision === 'decorative') {
      asset.altDecision = 'decorative';
      asset.altText = '';
    } else {
      asset.altDecision = 'informative';
      const alt = (d.editedAlt || asset.altText || '').trim();
      if (alt.length <= 20)
        fail(
          `${asset.assetId}: approved informative alt is too short (<=20 chars): ${JSON.stringify(alt)}`,
        );
      asset.altText = alt;
    }
    altApplied++;
    applied.push(asset.assetId);
  }
  updated++;
}

const summary = {
  manifestPath,
  activeAssets: active.length,
  lanesRecordedFor: updated,
  altTextApplied: altApplied,
  undecided: undecided.length,
  partial,
  dryRun,
};

if (dryRun) {
  stdout.write(
    `review:apply — DRY RUN OK\n${JSON.stringify(summary, null, 2)}\n`,
  );
  exit(0);
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
stdout.write(`review:apply — OK\n${JSON.stringify(summary, null, 2)}\n`);
