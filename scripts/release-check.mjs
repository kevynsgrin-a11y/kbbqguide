#!/usr/bin/env node
// Phase 10.7 release-readiness gate. Asserts and reports PASS/FAIL per item; it
// NEVER performs release authorization (that is an operator-only, separately
// recorded step). Exits non-zero if any gate fails so CI reflects readiness.
//
// Gates (directive §12.4):
//   1. Every active asset has all five review lanes approved (or an operator waiver).
//   2. lint:content clean on the built site.
//   3. Screenshot + structural evidence cover the release tree with full coverage.
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

// QA artifacts necessarily live in a commit after the source tree they test.
// Accept that evidence commit (and later documentation/state-only commits) only
// when no runtime source changed after the recorded evidence SHA.
const EVIDENCE_ONLY_PATHS = [
  'qa/phase-10/',
  'docs/',
  'OPERATOR-ACTIONS.md',
  'project-state.json',
];
const isEvidenceOnlyPath = (file) =>
  EVIDENCE_ONLY_PATHS.some((prefix) =>
    prefix.endsWith('/') ? file.startsWith(prefix) : file === prefix,
  );
function evidenceCoverage(evidenceSha) {
  const workingTree = [
    run('git', ['diff', '--name-only', 'HEAD', '--']),
    run('git', ['diff', '--cached', '--name-only', '--']),
    run('git', ['ls-files', '--others', '--exclude-standard']),
  ];
  const uncommittedRuntime = [
    ...new Set(
      workingTree.flatMap((result) => result.out.split('\n').filter(Boolean)),
    ),
  ].filter((file) => !isEvidenceOnlyPath(file));
  if (uncommittedRuntime.length)
    return {
      pass: false,
      detail: `uncommitted runtime changes: ${uncommittedRuntime.slice(0, 6).join(', ')}${uncommittedRuntime.length > 6 ? ', ...' : ''}`,
    };
  if (!evidenceSha || evidenceSha === 'unknown')
    return { pass: false, detail: 'missing evidence SHA' };
  const ancestor = run('git', [
    'merge-base',
    '--is-ancestor',
    evidenceSha,
    HEAD,
  ]);
  if (ancestor.code !== 0)
    return {
      pass: false,
      detail: `${evidenceSha.slice(0, 7)} is not an ancestor of HEAD`,
    };
  if (evidenceSha === HEAD) return { pass: true, detail: 'exact HEAD' };
  const diff = run('git', [
    'diff',
    '--name-only',
    `${evidenceSha}..${HEAD}`,
    '--',
  ]);
  if (diff.code !== 0)
    return { pass: false, detail: `could not compare evidence: ${diff.out}` };
  const changed = diff.out.split('\n').filter(Boolean);
  const runtimeChanges = changed.filter((file) => !isEvidenceOnlyPath(file));
  return {
    pass: runtimeChanges.length === 0,
    detail:
      runtimeChanges.length === 0
        ? `${evidenceSha.slice(0, 7)} + evidence/docs-only commits`
        : `runtime changes after evidence: ${runtimeChanges.slice(0, 6).join(', ')}${runtimeChanges.length > 6 ? ', ...' : ''}`,
  };
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

// Gate 3 — screenshot + structural evidence cover the current release tree.
try {
  const qa = JSON.parse(readFileSync('qa/phase-10/qa-manifest.json', 'utf8'));
  const structural = JSON.parse(
    readFileSync('qa/phase-10/structural-report.json', 'utf8'),
  );
  const sameEvidenceSha = qa.sha === structural.sha;
  const coverage = evidenceCoverage(qa.sha);
  const screenshotCoverage = qa.captures === EXPECTED_CAPTURES;
  const structuralCoverage =
    structural.totalRoutes === 116 &&
    structural.passed === 116 &&
    structural.failed === 0;
  const pass =
    sameEvidenceSha &&
    coverage.pass &&
    screenshotCoverage &&
    structuralCoverage;
  gates.push({
    id: 'qa-evidence-tree-and-coverage',
    pass,
    detail: `qa ${qa.sha?.slice(0, 7)} / structural ${structural.sha?.slice(0, 7)}; ${coverage.detail}; captures ${qa.captures}/${EXPECTED_CAPTURES}; structural ${structural.passed}/${structural.totalRoutes}`,
  });
} catch (e) {
  gates.push({
    id: 'qa-evidence-tree-and-coverage',
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
