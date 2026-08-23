import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

function pngDimensions(path: string) {
  const png = readFileSync(resolve(root, path));
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe('P2 theme, PWA-surface, and browser-icon controls', () => {
  it('follows the system color preference with semantic tokens and no stored toggle', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const css = source('src/styles/global.css');

    expect(layout).toContain(
      '<meta name="color-scheme" content="light dark" />',
    );
    expect(layout).toContain('media="(prefers-color-scheme: light)"');
    expect(layout).toContain('media="(prefers-color-scheme: dark)"');
    expect(css).toContain('@media screen and (prefers-color-scheme: dark)');
    expect(css).toContain('--surface-canvas: #171a15;');
    expect(css).toContain('--text-primary: #f6f0e7;');
    expect(css).toContain('--border-subtle: #4d534a;');
    expect(css).toContain('color-scheme: dark;');
    expect(layout).not.toMatch(
      /localStorage|sessionStorage|data-theme|theme-toggle/i,
    );
  });

  it('does not advertise installability without an offline contract', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    expect(layout).not.toMatch(/<link\s+rel="manifest"/i);
    expect(layout).not.toContain('site.webmanifest');
    expect(existsSync(resolve(root, 'src/pages/site.webmanifest.ts'))).toBe(
      false,
    );
    expect(source('scripts/validate-built-preview.mjs')).toContain(
      'PWA manifest must not be emitted without offline support.',
    );
  });

  it('ships SVG, PNG fallback, and Apple touch icons rasterized from the first-party mark', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    expect(layout).toContain('/favicon.svg');
    expect(layout).toContain('/favicon-32.png');
    expect(layout).toContain('/apple-touch-icon.png');
    expect(pngDimensions('public/favicon-32.png')).toEqual({
      width: 32,
      height: 32,
    });
    expect(pngDimensions('public/apple-touch-icon.png')).toEqual({
      width: 180,
      height: 180,
    });

    const rasterizer = source('scripts/generate-favicon-icons.mjs');
    expect(rasterizer).toContain('public/favicon.svg');
    expect(rasterizer).toContain("filename: 'favicon-32.png'");
    expect(rasterizer).toContain("filename: 'apple-touch-icon.png'");
  });
});
