// Shared QA harness: a tiny static server for dist/ plus a Chromium launcher
// that resolves the pre-installed browser (revision-agnostic). Used by the
// Phase 10 disclosure audit, structural/axe suite, and screenshot matrix.

import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/** Start a static file server rooted at `dir`. Returns { origin, close }. */
export async function startServer(dir = 'dist') {
  const root = path.resolve(dir);
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let filePath = path.join(root, url);
      if (existsSync(filePath) && (await stat(filePath)).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      } else if (!existsSync(filePath) && existsSync(`${filePath}.html`)) {
        filePath = `${filePath}.html`;
      }
      if (!existsSync(filePath)) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      const body = await readFile(filePath);
      res.setHeader(
        'Content-Type',
        MIME[path.extname(filePath)] ?? 'application/octet-stream',
      );
      res.end(body);
    } catch {
      res.statusCode = 500;
      res.end('error');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Resolve the pre-installed Chromium executable regardless of revision. */
function resolveChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(base)) return undefined;
  const dirs = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d));
  for (const d of dirs) {
    const exe = path.join(base, d, 'chrome-linux', 'chrome');
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

/** Launch Chromium, preferring Playwright's own resolution, then the glob fallback. */
export async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch {
    const executablePath = resolveChromium();
    if (!executablePath) throw new Error('No Chromium executable found');
    return await chromium.launch({ executablePath });
  }
}

/** List every built HTML route as a site-absolute path with trailing slash. */
export async function listRoutes(dir = 'dist') {
  const root = path.resolve(dir);
  const out = [];
  async function walk(d) {
    for (const entry of await readdir(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name === 'index.html') {
        const rel = path.relative(root, path.dirname(full));
        out.push(`/${rel ? `${rel}/` : ''}`);
      }
    }
  }
  await walk(root);
  return out.sort();
}

// --- Colour / contrast helpers (WCAG 2.x) ------------------------------------

function parseColor(str) {
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(/[,/]/).map((s) => s.trim());
  const [r, g, b] = parts.map((p) => parseFloat(p));
  const a = parts[3] != null ? parseFloat(parts[3]) : 1;
  return { r, g, b, a };
}

function compositeOver(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function relLuminance({ r, g, b }) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fgStr, bgStr) {
  const fg = parseColor(fgStr);
  const bg = parseColor(bgStr);
  if (!fg || !bg) return null;
  const l1 = relLuminance(
    fg.a < 1 ? compositeOver(fg, { r: 255, g: 255, b: 255 }) : fg,
  );
  const l2 = relLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Worst-case contrast of opaque text over a (possibly translucent) panel that
 * itself sits over an unknown image: composite the panel over both white and
 * black and take the lower contrast. A pass here holds over any image behind it.
 */
export function worstCaseContrast(textColor, panelBg) {
  const text = parseColor(textColor);
  const panel = parseColor(panelBg);
  if (!text || !panel) return null;
  const overWhite = compositeOver(panel, { r: 255, g: 255, b: 255 });
  const overBlack = compositeOver(panel, { r: 0, g: 0, b: 0 });
  const textSolid = text.a < 1 ? compositeOver(text, overWhite) : text;
  const c1 = rawContrast(textSolid, overWhite);
  const c2 = rawContrast(
    text.a < 1 ? compositeOver(text, overBlack) : text,
    overBlack,
  );
  return Math.min(c1, c2);
}

function rawContrast(a, b) {
  const l1 = relLuminance(a);
  const l2 = relLuminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
