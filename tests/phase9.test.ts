import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import mediaData from '../data/media-manifest.json';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

function jpegDimensions(path: string): { width: number; height: number } {
  const data = readFileSync(resolve(root, path));
  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) throw new Error(`Invalid JPEG marker: ${path}`);
    const marker = data[offset + 1];
    const length = data.readUInt16BE(offset + 2);
    if (marker && marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: data.readUInt16BE(offset + 5),
        width: data.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error(`JPEG dimensions not found: ${path}`);
}

describe('Phase 9 visual editorial overhaul', () => {
  it('registers the complete local campaign with honest status and provenance', () => {
    expect(mediaData).toMatchObject({
      version: 3,
      phase: 9,
      status: 'implementation-screened-synthetic-hero-campaign-active',
    });
    expect(mediaData.assets).toHaveLength(81);
    expect(new Set(mediaData.assets.map((asset) => asset.assetId)).size).toBe(
      81,
    );
    for (const asset of mediaData.assets) {
      expect(asset.assetStatus).toBe('synthetic-labeled');
      expect(asset.provenance.creator).toContain('OpenAI');
      expect(asset.provenance.disclosure).toMatch(/AI-generated/i);
      expect(asset.rights.externalLicense).toBeNull();
      expect(asset.qa.implementationVisualReview).toBe('pass');
      expect(asset.qa.humanEditorialReview).toBe('required');
      expect(asset.altText.length).toBeGreaterThan(20);
      expect(asset.caption.length).toBeGreaterThan(20);
      expect(asset.credit).toMatch(/Synthetic image/);
    }
  });

  it('has no missing, remote, undersized, or orphaned recipe master', () => {
    const paths = new Set(mediaData.assets.map((asset) => asset.path));
    expect(paths.size).toBe(81);
    for (const asset of mediaData.assets) {
      expect(asset.path).not.toMatch(/^https?:/);
      expect(existsSync(resolve(root, asset.path))).toBe(true);
      expect(statSync(resolve(root, asset.path)).size).toBeGreaterThan(100_000);
      expect(jpegDimensions(asset.path)).toEqual({
        width: asset.width,
        height: asset.height,
      });
      expect(asset.width).toBeGreaterThanOrEqual(2400);
    }
    expect(
      mediaData.assets.filter((asset) => asset.role === 'finished-dish-hero'),
    ).toHaveLength(80);
  });

  it('activates every recipe hero and keeps unproduced process media honest', () => {
    expect(mediaData.recipePlans).toHaveLength(80);
    for (const plan of mediaData.recipePlans) {
      expect(plan.hero.assetStatus).toBe('synthetic-labeled');
      expect(plan.hero.path).toMatch(/hero-master\.jpg$/);
      expect(plan.hero.width).toBe(2400);
      expect(plan.hero.height).toBe(1600);
      expect(plan.stillShots.finishedDishOverhead.assetStatus).toBe(
        'placeholder',
      );
      expect(plan.videoPlans.longForm.assetStatus).toBe('placeholder');
      expect(plan.videoPlans.shortForm.assetStatus).toBe('placeholder');
    }
  });

  it('uses a build-safe responsive component with modern formats and loading policy', () => {
    const registry = source('src/lib/media.ts');
    const responsive = source('src/components/ResponsiveMedia.astro');
    const placeholder = source('src/components/MediaPlaceholder.astro');
    expect(registry).toContain('import.meta.glob');
    expect(registry).toContain('../assets/media/**/*.jpg');
    expect(responsive).toContain("formats={['avif', 'webp']}");
    expect(responsive).toContain('widths={[360, 640, 960, 1280, 1600]}');
    expect(responsive).toContain('quality={75}');
    expect(responsive).toContain("loading={priority ? 'eager' : 'lazy'}");
    expect(responsive).toContain("fetchpriority={priority ? 'high' : 'auto'}");
    expect(placeholder).toContain('resolveMedia(mediaId)');
  });

  it('covers the home, category, recipe, guide, menu, and social entry points', () => {
    expect(source('src/pages/index.astro')).toContain('HOME-hero');
    expect(source('src/pages/recipes/[category]/index.astro')).toContain(
      'category.id}-hero',
    );
    expect(source('src/components/RecipePage.astro')).toContain(
      'recipe.id}-hero',
    );
    expect(source('src/components/GuidePage.astro')).toContain(
      'guide.id}-hero',
    );
    expect(source('src/pages/menus/[guests].astro')).toContain('menu.id}-hero');
    expect(existsSync(resolve(root, 'public/social/kbbqguide-home.jpg'))).toBe(
      true,
    );
    expect(source('src/layouts/BaseLayout.astro')).toContain(
      'summary_large_image',
    );
  });

  it('records the migration, inventory, review boundary, and browser QA plan', () => {
    for (const path of [
      'docs/media-assets-phase9.csv',
      'docs/MEDIA-HUMAN-REVIEW.md',
      'docs/PHASE-9-VISUAL-EDITORIAL-HANDOFF.md',
      'docs/PHASE-9-BROWSER-QA.md',
    ])
      expect(existsSync(resolve(root, path))).toBe(true);
  });
});
