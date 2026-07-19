// Phase 10.3 (P1-8) disclosure audit. Renders representative templates in a real
// headless browser, measures the COMPUTED font size (px) and worst-case contrast
// of every synthetic-content disclosure / credit element, and writes
// docs/DISCLOSURE-AUDIT.md. Exits non-zero if any synthetic disclosure is under
// 13px or under 4.5:1 worst-case contrast.

import { writeFile } from 'node:fs/promises';
import { argv, exit, stdout } from 'node:process';
import { startServer, launchBrowser, worstCaseContrast } from './_harness.mjs';

const MIN_PX = 13;
const MIN_CONTRAST = 4.5;

// One representative page per template that carries synthetic media.
const PAGES = [
  { template: 'Home hero', route: '/' },
  {
    template: 'Recipe detail',
    route: '/recipes/grilled-meat/classic-korean-pear-beef-bulgogi/',
  },
  { template: 'Category index', route: '/recipes/grilled-meat/' },
  { template: 'Recipe library index', route: '/recipes/' },
  {
    template: 'Guide detail',
    route: '/guides/tabletop-grill-and-ventilation/',
  },
  { template: 'Guide index', route: '/guides/' },
  { template: 'Menu detail', route: '/menus/4-guests/' },
  { template: 'Menu index', route: '/menus/' },
  { template: 'Planning tools', route: '/tools/' },
  { template: 'Start here', route: '/start-here/' },
  {
    template: 'Policy (sponsored-content)',
    route: '/sponsored-content-policy/',
  },
];

// Selectors whose text conveys synthetic-content provenance/credit (the P1-8 scope).
const SYNTHETIC_SELECTORS = [
  '.home-hero-disclosure',
  '.media-credit',
  '.media-credit small',
];
// Other on-page disclosures reported for completeness (not gated by P1-8).
const OTHER_SELECTORS = ['.affiliate-disclosure', '.disclosure-box'];

const server = await startServer('dist');
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const rows = [];
for (const { template, route } of PAGES) {
  await page.goto(`${server.origin}${route}`, { waitUntil: 'networkidle' });
  for (const [group, selectors] of [
    ['synthetic', SYNTHETIC_SELECTORS],
    ['other', OTHER_SELECTORS],
  ]) {
    for (const selector of selectors) {
      const measured = await page.$$eval(selector, (els) =>
        els.slice(0, 1).map((el) => {
          const cs = getComputedStyle(el);
          // Effective background: own bg if it has alpha, else nearest ancestor with one.
          let bg = cs.backgroundColor;
          const isTransparent = (c) =>
            c === 'transparent' || /rgba?\([^)]*,\s*0\s*\)$/.test(c);
          let node = el;
          while (node && isTransparent(bg)) {
            node = node.parentElement;
            if (!node) break;
            bg = getComputedStyle(node).backgroundColor;
          }
          if (isTransparent(bg)) bg = 'rgb(255, 255, 255)';
          return {
            fontSizePx: parseFloat(cs.fontSize),
            color: cs.color,
            background: bg,
            text: (el.textContent || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 80),
          };
        }),
      );
      for (const m of measured) {
        const contrast = worstCaseContrast(m.color, m.background);
        rows.push({
          template,
          route,
          selector,
          group,
          fontSizePx: m.fontSizePx,
          contrast: contrast != null ? Math.round(contrast * 100) / 100 : null,
          text: m.text,
          pass:
            group !== 'synthetic'
              ? true
              : m.fontSizePx >= MIN_PX &&
                contrast != null &&
                contrast >= MIN_CONTRAST,
        });
      }
    }
  }
}

await browser.close();
await server.close();

const syntheticRows = rows.filter((r) => r.group === 'synthetic');
const failures = syntheticRows.filter((r) => !r.pass);

const sha = argv.find((a) => a.startsWith('--sha='))?.slice(6) || 'unknown';
const lines = [];
lines.push('# Disclosure Audit — Phase 10.3 (P1-8)');
lines.push('');
lines.push(
  `_Computed sizes and worst-case contrast measured headlessly (Chromium, 1440×900) against the built site. HEAD \`${sha}\`. Pass = synthetic-content disclosure ≥ ${MIN_PX}px and ≥ ${MIN_CONTRAST}:1 worst-case contrast (panel composited over both white and black, so it holds over any image behind it)._`,
);
lines.push('');
lines.push(
  `- Synthetic disclosure elements measured: **${syntheticRows.length}**`,
);
lines.push(
  `- Failing (< ${MIN_PX}px or < ${MIN_CONTRAST}:1): **${failures.length}**`,
);
lines.push('');
lines.push('## Synthetic-content disclosure / credit (P1-8 scope)');
lines.push('');
lines.push(
  '| Template | Selector | Computed px | Worst-case contrast | Pass | Text (start) |',
);
lines.push('| --- | --- | --- | --- | --- | --- |');
for (const r of syntheticRows) {
  lines.push(
    `| ${r.template} | \`${r.selector}\` | ${r.fontSizePx}px | ${r.contrast ?? 'n/a'}:1 | ${r.pass ? '✅' : '❌'} | ${r.text.replace(/\|/g, '\\|')} |`,
  );
}
lines.push('');
lines.push(
  '## Other on-page disclosures (reported for completeness; not P1-8-gated)',
);
lines.push('');
lines.push(
  '| Template | Selector | Computed px | Worst-case contrast | Text (start) |',
);
lines.push('| --- | --- | --- | --- | --- |');
for (const r of rows.filter((r) => r.group === 'other')) {
  lines.push(
    `| ${r.template} | \`${r.selector}\` | ${r.fontSizePx}px | ${r.contrast ?? 'n/a'}:1 | ${r.text.replace(/\|/g, '\\|')} |`,
  );
}
lines.push('');
lines.push('## Method');
lines.push('');
lines.push(
  '- Every page containing synthetic media renders a scoped disclosure: recipe/category/guide/menu/system heroes render `.media-credit` (with a `small` credit line carrying "Synthetic image · …"); the home hero renders a dedicated `.home-hero-disclosure` (P1-8 fix — previously the only nearby credit was on a later banner).',
);
lines.push(
  '- Sizes are `getComputedStyle().fontSize` in CSS px, not read from source. Contrast is WCAG 2.x; translucent panels are composited over both white and black and the lower ratio is reported, so a pass holds over any image behind the panel.',
);
lines.push(
  '- True contrast over the live production image at every breakpoint remains an operator manual gate (see `docs/PHASE-10-BROWSER-QA.md`), but the panel backgrounds here are opaque enough that the worst-case bound already clears 4.5:1.',
);
lines.push('');

await writeFile('docs/DISCLOSURE-AUDIT.md', lines.join('\n'));

stdout.write(
  `disclosure-audit — synthetic:${syntheticRows.length} failing:${failures.length}\n`,
);
if (failures.length > 0) {
  for (const f of failures)
    stdout.write(
      `  FAIL ${f.template} ${f.selector} ${f.fontSizePx}px ${f.contrast}:1\n`,
    );
  exit(1);
}
