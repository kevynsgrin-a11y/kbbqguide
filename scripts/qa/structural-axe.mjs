// Phase 10.3 (§7C) + 10.5 structural + axe suite. Runs sitewide (all built
// routes), enforcing: exactly one h1, one <main>, html[lang], zero images
// missing an alt ATTRIBUTE, no unnamed controls / empty links, no horizontal
// overflow at 390 and 768, and zero serious/critical axe-core violations.
// Writes qa/phase-10/structural-report.json and exits non-zero on any failure.

import { mkdir, writeFile } from 'node:fs/promises';
import { argv, exit, stdout } from 'node:process';
import AxeBuilder from '@axe-core/playwright';
import { startServer, launchBrowser, listRoutes } from './_harness.mjs';

const sha = argv.find((a) => a.startsWith('--sha='))?.slice(6) || 'unknown';
const OVERFLOW_WIDTHS = [390, 768];

const server = await startServer('dist');
const browser = await launchBrowser();
const routes = await listRoutes('dist');

const pageResults = [];
let failed = 0;

const context = await browser.newContext();

for (const route of routes) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${server.origin}${route}`, { waitUntil: 'networkidle' });

  const structural = await page.evaluate(() => {
    const accessibleName = (el) => {
      const aria = el.getAttribute('aria-label');
      if (aria && aria.trim()) return true;
      const labelledby = el.getAttribute('aria-labelledby');
      if (labelledby && labelledby.trim()) return true;
      const title = el.getAttribute('title');
      if (title && title.trim()) return true;
      if ((el.textContent || '').trim()) return true;
      const img = el.querySelector('img[alt]');
      if (img && (img.getAttribute('alt') || '').trim()) return true;
      if (el.querySelector('svg [role="img"], svg title')) return true;
      return false;
    };
    const h1s = document.querySelectorAll('h1').length;
    const mains = document.querySelectorAll('main, [role="main"]').length;
    const lang = document.documentElement.getAttribute('lang') || '';
    const imgsMissingAlt = [...document.querySelectorAll('img')].filter(
      (img) => !img.hasAttribute('alt'),
    ).length;
    const links = [...document.querySelectorAll('a[href]')];
    const emptyLinks = links.filter((a) => !accessibleName(a)).length;
    const controls = [
      ...document.querySelectorAll(
        'button, [role="button"], input:not([type="hidden"]), select, textarea',
      ),
    ];
    const unnamedControls = controls.filter((c) => {
      if (c.matches('input, select, textarea')) {
        if (c.labels && c.labels.length) return false;
        return !accessibleName(c) && !c.getAttribute('placeholder');
      }
      return !accessibleName(c);
    }).length;
    return { h1s, mains, lang, imgsMissingAlt, emptyLinks, unnamedControls };
  });

  const overflow = {};
  for (const width of OVERFLOW_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    overflow[width] = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  let axeViolations;
  try {
    const results = await new AxeBuilder({ page })
      .options({ resultTypes: ['violations'] })
      .analyze();
    axeViolations = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  } catch (e) {
    axeViolations = [
      { id: 'axe-error', impact: 'critical', message: String(e).slice(0, 120) },
    ];
  }

  const problems = [];
  if (structural.h1s !== 1) problems.push(`h1 count ${structural.h1s}`);
  if (structural.mains !== 1) problems.push(`main count ${structural.mains}`);
  if (!structural.lang) problems.push('missing html lang');
  if (structural.imgsMissingAlt > 0)
    problems.push(`${structural.imgsMissingAlt} img without alt attr`);
  if (structural.emptyLinks > 0)
    problems.push(`${structural.emptyLinks} empty links`);
  if (structural.unnamedControls > 0)
    problems.push(`${structural.unnamedControls} unnamed controls`);
  for (const width of OVERFLOW_WIDTHS)
    if (overflow[width]) problems.push(`horizontal overflow @${width}`);
  if (axeViolations.length > 0)
    problems.push(
      `axe serious/critical: ${axeViolations.map((v) => v.id).join(',')}`,
    );

  if (problems.length) failed++;
  pageResults.push({ route, structural, overflow, axeViolations, problems });
  await page.close();
}

await context.close();
await browser.close();
await server.close();

const report = {
  sha,
  generatedBy: 'phase-10-agent',
  totalRoutes: routes.length,
  passed: routes.length - failed,
  failed,
  overflowWidths: OVERFLOW_WIDTHS,
  axeGate: 'zero serious/critical',
  pages: pageResults,
};
await mkdir('qa/phase-10', { recursive: true });
await writeFile(
  'qa/phase-10/structural-report.json',
  `${JSON.stringify(report, null, 2)}\n`,
);

stdout.write(
  `structural-axe — routes:${routes.length} passed:${report.passed} failed:${failed}\n`,
);
if (failed > 0) {
  for (const p of pageResults.filter((p) => p.problems.length))
    stdout.write(`  FAIL ${p.route} — ${p.problems.join('; ')}\n`);
  exit(1);
}
