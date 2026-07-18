#!/usr/bin/env node
// Phase 10.7 release-readiness gate. Asserts and reports PASS/FAIL per item; it
// NEVER performs release authorization (that is an operator-only, separately
// recorded step). Exits non-zero if any gate fails so CI reflects readiness.
//
// Gates (directive §12.4):
//   1. Every active asset has all five review lanes approved (or an operator waiver).
//   2. lint:content clean on the built site.
//   3. qa-manifest.json SHA == current HEAD with full route/width coverage.
//   4. Disclosure audit passing (computed sizes verified headlessly).
//   5. production.originStatus === "resolved".
//   6. noindex,nofollow,noarchive still present on every built page.

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { exit, stdout } from 'node:process';

const LANES = ['food', 'safety', 'cultural', 'accessibility', 'brand'];
const EXPECTED_CAPTURES = 18 * 5; // 18 routes x 5 widths

function head() {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}
function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return { code: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') };
}
function walkHtml(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walkHtml(full));
    else if (e.endsWith('.html')) out.push(full);
  }
  return out;
}

const HEAD = head();
const gates = [];

// Gate 1 — every active asset fully lane-approved or waived.
try {
  const m = JSON.parse(readFileSync('data/media-manifest.json', 'utf8'));
  const active = m.assets.filter((a) => a.status !== 'replaced');
  const notReady = active.filter((a) => {
    const r = a.humanEditorialReview;
    if (!r) return true;
    if (r.waiver === true) return false;
    return !LANES.every((l) => r.lanes?.[l]?.decision === 'approve');
  });
  gates.push({
    id: 'asset-lanes-approved',
    pass: notReady.length === 0,
    detail: `${active.length - notReady.length}/${active.length} active assets fully approved or waived`,
  });
} catch (e) {
  gates.push({
    id: 'asset-lanes-approved',
    pass: false,
    detail: `error: ${e}`,
  });
}

// Gate 2 — lint:content clean (requires a build present).
{
  const r = run('node', ['scripts/lint-content.mjs', '--no-build']);
  gates.push({
    id: 'lint-content-clean',
    pass: r.code === 0,
    detail: r.out.trim().split('\n').pop() || '',
  });
}

// Gate 3 — qa-manifest SHA == HEAD and full coverage.
try {
  const qa = JSON.parse(readFileSync('qa/phase-10/qa-manifest.json', 'utf8'));
  const pass = qa.sha === HEAD && qa.captures === EXPECTED_CAPTURES;
  gates.push({
    id: 'qa-matrix-sha-and-coverage',
    pass,
    detail: `qa sha ${qa.sha?.slice(0, 7)} vs HEAD ${HEAD.slice(0, 7)}; captures ${qa.captures}/${EXPECTED_CAPTURES}`,
  });
} catch (e) {
  gates.push({
    id: 'qa-matrix-sha-and-coverage',
    pass: false,
    detail: `error: ${e}`,
  });
}

// Gate 4 — disclosure audit passing (headless).
{
  const r = run('node', ['scripts/qa/disclosure-audit.mjs', `--sha=${HEAD}`]);
  gates.push({
    id: 'disclosure-audit',
    pass: r.code === 0,
    detail: r.out.trim().split('\n').pop() || '',
  });
}

// Gate 5 — production origin resolved.
try {
  const st = JSON.parse(readFileSync('project-state.json', 'utf8'));
  const status = st.production?.originStatus;
  gates.push({
    id: 'production-origin-resolved',
    pass: status === 'resolved',
    detail: `production.originStatus = ${JSON.stringify(status)}`,
  });
} catch (e) {
  gates.push({
    id: 'production-origin-resolved',
    pass: false,
    detail: `error: ${e}`,
  });
}

// Gate 6 — noindex present on every built page.
{
  const files = walkHtml('dist');
  const missing = files.filter(
    (f) => !readFileSync(f, 'utf8').includes('noindex,nofollow,noarchive'),
  );
  gates.push({
    id: 'noindex-present',
    pass: files.length > 0 && missing.length === 0,
    detail: `${files.length - missing.length}/${files.length} pages carry noindex,nofollow,noarchive`,
  });
}

const allPass = gates.every((g) => g.pass);

stdout.write(
  '\nrelease:check — Phase 10.7 readiness gate (never authorizes)\n',
);
stdout.write(`HEAD ${HEAD.slice(0, 7)}\n\n`);
for (const g of gates)
  stdout.write(`  [${g.pass ? 'PASS' : 'FAIL'}] ${g.id} — ${g.detail}\n`);
stdout.write(
  `\n  Overall readiness: ${allPass ? 'ALL GATES PASS' : 'NOT READY'}\n`,
);
stdout.write(
  '  Release authorization: PENDING (operator-only; this gate never performs it).\n\n',
);

exit(allPass ? 0 : 1);
