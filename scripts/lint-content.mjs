#!/usr/bin/env node
// Phase 10 content lint (P1-9). Builds the site if needed, then scans the built
// HTML for banned, user-visible data defects and exits non-zero on any hit.
//
// Usage:
//   node scripts/lint-content.mjs            # build if dist/ is missing, then scan
//   node scripts/lint-content.mjs --build    # always rebuild first
//   node scripts/lint-content.mjs --no-build # scan the existing dist/ only
//
// Regexes are deliberately targeted and verified to have zero false positives
// against the full build. Note: plain draft ids like "Draft M05" are legitimate
// and are NOT banned; only the placeholder-taxonomy chip leak (e.g. "· none") is.

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { argv, exit, stderr, stdout } from 'node:process';

const DIST = 'dist';
const args = new Set(argv.slice(2));

if (args.has('--build') || (!existsSync(DIST) && !args.has('--no-build'))) {
  stdout.write('lint:content — building site first...\n');
  execSync('cross-env ASTRO_TELEMETRY_DISABLED=1 astro build', {
    stdio: 'inherit',
  });
}

if (!existsSync(DIST)) {
  stderr.write('lint:content — no dist/ to scan. Run the build first.\n');
  exit(2);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

// Strip scripts/styles/json-ld so we only scan user-visible rendered markup.
function visibleMarkup(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

// Each rule: { id, description, re }. `re` runs against the visible markup.
const RULES = [
  {
    id: 'taxonomy-none-chip',
    description: 'Placeholder taxonomy "none" rendered as a chip/value',
    re: /·\s*none\b/gi,
  },
  {
    id: 'taxonomy-placeholder-chip',
    description: 'Placeholder taxonomy value rendered inside a chip element',
    re: /<(?:span|small|strong|li|p)[^>]*>\s*(?:none|placeholder|tbd)\s*<\/(?:span|small|strong|li|p)>/gi,
  },
  {
    id: 'draft-id-none-leak',
    description: 'Draft id followed by a raw "· none" taxonomy leak',
    re: /Draft\s+[A-Z]+\d+\s*·\s*none/gi,
  },
  {
    id: 'undefined-text',
    description: 'Literal "undefined" in rendered text',
    re: /\bundefined\b/g,
  },
  {
    id: 'null-text',
    description: 'Literal "null" rendered as text',
    re: />\s*null\s*<|\bnull\b/g,
  },
  {
    id: 'nan-text',
    description: 'Literal "NaN" in rendered text',
    re: /\bNaN\b/g,
  },
  {
    id: 'object-object',
    description: 'Stringified object leak "[object ..."',
    re: /\[object\s/g,
  },
  {
    id: 'duplicated-noun',
    description:
      'Duplicated adjacent ingredient noun (e.g. "scallion scallion")',
    re: /\b(scallions?|eggs?|onions?|cloves?|leaves?|leaf|sheets?|carrots?|potatoes?|mushrooms?)\s+\1\b/gi,
  },
  {
    id: 'decimal-mass-volume',
    description: '>= 2-decimal gram/ml/kg/l artifact in a measure',
    re: /\d+\.\d{2,}\s?(?:g|ml|kg|l)\b/g,
  },
];

const files = walk(DIST);
const findings = [];
for (const file of files) {
  const markup = visibleMarkup(readFileSync(file, 'utf8'));
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(markup)) !== null) {
      const start = Math.max(0, m.index - 30);
      const context = markup
        .slice(start, m.index + m[0].length + 30)
        .replace(/\s+/g, ' ')
        .trim();
      findings.push({
        file: path.relative('.', file),
        rule: rule.id,
        match: m[0],
        context,
      });
      if (!rule.re.global) break;
    }
  }
}

const summary = {
  htmlPages: files.length,
  rules: RULES.length,
  findings: findings.length,
};

if (findings.length > 0) {
  stderr.write('lint:content — FAILED. Banned patterns found:\n\n');
  for (const f of findings.slice(0, 100)) {
    stderr.write(
      `  [${f.rule}] ${f.file}\n    match: ${JSON.stringify(f.match)}\n    ...${f.context}...\n`,
    );
  }
  stderr.write(`\n${JSON.stringify(summary)}\n`);
  exit(1);
}

stdout.write(`lint:content — clean. ${JSON.stringify(summary)}\n`);
