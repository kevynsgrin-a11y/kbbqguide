// Phase 10.5 screenshot matrix. Captures the 18 representative review routes at
// widths 390/768/1440/1920 plus 320 (WCAG 1.4.10 reflow proxy) against the local
// build of the current HEAD. Writes qa/phase-10/screenshots/{slug}--{w}w--{sha7}.png
// and qa/phase-10/qa-manifest.json ({sha,timestamp,route,width,path,buildCommand}).

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argv, stdout } from 'node:process';
import { startServer, launchBrowser } from './_harness.mjs';

const sha = argv.find((a) => a.startsWith('--sha='))?.slice(6) || 'unknown';
const sha7 = sha.slice(0, 7);
const buildCommand = 'npm run build';
// Viewport captures by default (commit-friendly; show layout/crop/overflow at each
// breakpoint). Pass --full for full-page captures (much larger; regenerate locally).
const fullPage = argv.includes('--full');
const WIDTHS = [320, 390, 768, 1440, 1920];

// 18 representative routes from the 2026-07-17 review.
const ROUTES = [
  '/',
  '/recipes/',
  '/recipes/grilled-meat/',
  '/recipes/seafood/',
  '/recipes/banchan/',
  '/recipes/fresh/',
  '/recipes/sauces/',
  '/recipes/desserts/',
  '/recipes/grilled-meat/classic-korean-pear-beef-bulgogi/',
  '/recipes/seafood/gochujang-grilled-shrimp/',
  '/recipes/grilled-meat/korean-style-grilled-duck-breast/',
  '/recipes/banchan/gyeran-mari-rolled-omelet/',
  '/guides/',
  '/guides/tabletop-grill-and-ventilation/',
  '/guides/indoor-vs-outdoor-korean-bbq-safety/',
  '/menus/',
  '/menus/4-guests/',
  '/menus/8-guests/',
];

function slugify(route) {
  const s = route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  return s || 'home';
}

const outDir = 'qa/phase-10/screenshots';
await mkdir(outDir, { recursive: true });

const server = await startServer('dist');
const browser = await launchBrowser();
const timestamp = new Date().toISOString();
const manifest = [];

for (const route of ROUTES) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${server.origin}${route}`, { waitUntil: 'networkidle' });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
    const filename = `${slugify(route)}--${width}w--${sha7}.png`;
    const filepath = path.join(outDir, filename);
    await page.screenshot({ path: filepath, fullPage });
    manifest.push({
      sha,
      timestamp,
      route,
      width,
      path: filepath,
      fullPage,
      buildCommand,
    });
  }
  await context.close();
  stdout.write(`captured ${route} (${WIDTHS.length} widths)\n`);
}

await browser.close();
await server.close();

await writeFile(
  'qa/phase-10/qa-manifest.json',
  `${JSON.stringify({ sha, timestamp, buildCommand, widths: WIDTHS, routes: ROUTES.length, captures: manifest.length, matrix: manifest }, null, 2)}\n`,
);
stdout.write(
  `screenshots — ${manifest.length} captures (${ROUTES.length} routes x ${WIDTHS.length} widths) at ${sha7}\n`,
);
