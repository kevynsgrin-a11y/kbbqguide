// Deterministically rasterize first-party favicon.svg for browser fallback and
// Apple touch icon use. This intentionally creates no PWA manifest or service
// worker; the current safety-sensitive preview has no offline contract.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stdout } from 'node:process';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const svg = await readFile(resolve(root, 'public/favicon.svg'));
const source = `data:image/svg+xml;base64,${svg.toString('base64')}`;
const targets = [
  { filename: 'favicon-32.png', size: 32 },
  { filename: 'apple-touch-icon.png', size: 180 },
];
const browser = await chromium.launch();

try {
  for (const { filename, size } of targets) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<img id="favicon" alt="" src="${source}" width="${size}" height="${size}">`,
    );
    const icon = page.locator('#favicon');
    await icon.waitFor({ state: 'visible' });
    await page.waitForFunction(
      (element) =>
        Boolean(element) &&
        'complete' in element &&
        'naturalWidth' in element &&
        element.complete === true &&
        typeof element.naturalWidth === 'number' &&
        element.naturalWidth > 0,
      await icon.elementHandle(),
    );
    await icon.screenshot({ path: resolve(root, 'public', filename) });
    await page.close();
    stdout.write(`rasterized ${filename} from public/favicon.svg\n`);
  }
} finally {
  await browser.close();
}
