import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import mediaData from '../data/media-manifest.json';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

function filesUnder(relative: string): string[] {
  return readdirSync(resolve(root, relative), { withFileTypes: true }).flatMap(
    (entry) => {
      const child = `${relative}/${entry.name}`;
      return entry.isDirectory() ? filesUnder(child) : [child];
    },
  );
}

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

const assetsById = new Map(
  mediaData.assets.map((asset) => [asset.assetId, asset]),
);
const activeAssets = mediaData.assets.filter(
  (asset) => asset.status !== 'replaced',
);
function resolveActiveAsset(stableId: string) {
  let asset = assetsById.get(stableId);
  const seen = new Set<string>();
  while (asset?.status === 'replaced' && asset.replacedBy) {
    if (seen.has(asset.assetId))
      throw new Error(`Supersede cycle at ${stableId}`);
    seen.add(asset.assetId);
    asset = assetsById.get(asset.replacedBy);
  }
  return asset;
}
const recipePlans = mediaData.recipePlans;
const approvedStatuses = new Set([
  'original-approved',
  'licensed-approved',
  'synthetic-labeled',
]);

describe('Phase 9 visual editorial overhaul', () => {
  it('registers one immutable local record per active campaign asset', () => {
    expect(mediaData).toMatchObject({
      version: 4,
      phase: 9,
      status: 'implementation-screened-synthetic-hero-campaign-active',
    });
    expect(activeAssets).toHaveLength(115);
    expect(mediaData.assets.length).toBeGreaterThanOrEqual(activeAssets.length);
    expect(assetsById.size).toBe(mediaData.assets.length);

    for (const asset of mediaData.assets) {
      expect(asset.assetId).toMatch(
        /^[A-Za-z0-9_-]+(?:-hero|-banner|-texture)(?:-r\d+)?$/,
      );
      expect(approvedStatuses.has(asset.assetStatus)).toBe(true);
      expect(asset.kind).toBe('image');
      expect(asset.path).toMatch(/^src\/assets\/media\/.+\.jpg$/);
      expect(asset.path).not.toMatch(/^https?:|^\/\//);
      expect(asset.width).toBeGreaterThanOrEqual(2400);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.aspectRatio).toMatch(/^\d+:\d+$/);
      expect(asset.focalPoint).toMatch(/^\d+% \d+%$/);
      expect(asset.mobileCrop.length).toBeGreaterThan(4);
      expect(['informative', 'decorative']).toContain(asset.altDecision);
      if (asset.altDecision === 'decorative') expect(asset.altText).toBe('');
      else expect(asset.altText.length).toBeGreaterThan(20);
      expect(asset.caption.length).toBeGreaterThan(20);
      expect(asset.credit).toMatch(/Synthetic image/);
      expect(asset.provenance.creator).toContain('OpenAI');
      expect(asset.provenance.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(asset.provenance.sourceRecord.length).toBeGreaterThan(1);
      expect(asset.provenance.promptBasis.length).toBeGreaterThan(20);
      expect(asset.provenance.disclosure).toMatch(/AI-generated/i);
      expect(asset.rights.source.length).toBeGreaterThan(20);
      expect(asset.rights.scope.length).toBeGreaterThan(20);
      expect(asset.rights.externalLicense).toBeNull();
      expect(asset.qa).toMatchObject({
        implementationVisualReview: 'pass',
        implementationFoodSafetyScreen: 'pass',
        implementationCulturalAndIngredientScreen: 'pass',
        responsiveCropReview: 'pass',
        humanEditorialReview: 'required',
      });
      expect(asset.qa.reviewer).toMatch(/human sign-off not inferred/i);
    }
  });

  it('has no missing, remote, undersized, duplicate, or orphaned master', () => {
    const manifestPaths = new Set(mediaData.assets.map((asset) => asset.path));
    expect(manifestPaths.size).toBe(mediaData.assets.length);
    for (const asset of mediaData.assets) {
      expect(existsSync(resolve(root, asset.path))).toBe(true);
      expect(statSync(resolve(root, asset.path)).size).toBeGreaterThan(100_000);
      expect(jpegDimensions(asset.path)).toEqual({
        width: asset.width,
        height: asset.height,
      });
    }

    const localMasters = filesUnder('src/assets/media')
      .filter((path) => extname(path) === '.jpg')
      .sort();
    expect(localMasters).toHaveLength(mediaData.assets.length);
    expect([...manifestPaths].sort()).toEqual(localMasters);
  });

  it('activates all recipe heroes and preserves honest process-media fallbacks', () => {
    expect(recipePlans).toHaveLength(80);
    const recipeHeroIds = new Set(
      activeAssets
        .filter((asset) => asset.role === 'finished-dish-hero')
        .map((asset) => asset.assetId),
    );
    expect(recipeHeroIds.size).toBe(80);

    for (const plan of recipePlans) {
      const heroId = `${plan.recipeId}-hero`;
      expect(plan.hero.assetId).toBe(heroId);
      expect(plan.hero.assetStatus).toBe('synthetic-labeled');
      expect(resolveActiveAsset(heroId)?.role).toBe('finished-dish-hero');
      expect(assetsById.get(heroId)?.path).toBe(plan.hero.path);
      expect(plan.stillShots.finishedDishOverhead.assetStatus).toBe(
        'placeholder',
      );
      expect(plan.videoPlans.longForm.assetStatus).toBe('placeholder');
      expect(plan.videoPlans.shortForm.assetStatus).toBe('placeholder');
    }
  });

  it('provides distinct coverage for every major editorial entry point', () => {
    const expectedIds = [
      'HOME-gathering-hero',
      'HOME-editorial-banner',
      'CAT_MEAT-hero',
      'CAT_SEAFOOD-hero',
      'CAT_BANCHAN-hero',
      'CAT_FRESH-hero',
      'CAT_SAUCES-hero',
      'CAT_DESSERTS-hero',
      'SYS_RECIPES-hero',
      'SYS_GUIDES-hero',
      'SYS_MENUS-hero',
      ...Array.from(
        { length: 12 },
        (_, index) => `G${String(index + 1).padStart(2, '0')}-hero`,
      ),
      'MENU_2-hero',
      'MENU_4-hero',
      'MENU_8-hero',
      'SYS_START-hero',
      'SYS_TOOLS-hero',
      'SYS_SHOP-hero',
      'SYS_NEWSLETTER-hero',
      'SYS_CLASS-hero',
      'SYS_MEDIA_KIT-hero',
      'SYS_PARTNERSHIPS-hero',
      'SYS_LICENSING-hero',
      'POLICY-tabletop-texture',
    ];
    expect(expectedIds).toHaveLength(35);
    for (const id of expectedIds) expect(assetsById.has(id)).toBe(true);
    expect(new Set(expectedIds).size).toBe(expectedIds.length);
  });

  it('uses typed build-safe media components, direct IDs, and CSP-safe crops', () => {
    const registry = source('src/lib/media.ts');
    const responsive = source('src/components/ResponsiveMedia.astro');
    const fallback = source('src/components/MediaPlaceholder.astro');
    const hero = source('src/components/EditorialHero.astro');
    const banner = source('src/components/EditorialBanner.astro');
    const css = source('src/styles/global.css');
    expect(registry).toContain('import.meta.glob');
    expect(registry).toContain('../assets/media/**/*.jpg');
    expect(registry).not.toContain('const aliases');
    expect(responsive).toContain("formats={['avif', 'webp']}");
    expect(responsive).toContain('widths={[360, 640, 960, 1280, 1600]}');
    expect(responsive).toContain("loading={priority ? 'eager' : 'lazy'}");
    expect(responsive).toContain(
      "fetchpriority={priority ? 'high' : undefined}",
    );
    expect(responsive).toContain('decoding="async"');
    expect(responsive).not.toMatch(/style=/);
    expect(fallback).toContain('resolveMedia(mediaId)');
    expect(fallback).toContain('Photography in production');
    expect(hero).toContain('editorial-hero');
    expect(banner).toContain('editorial-banner');
    for (const asset of mediaData.assets) {
      const focalToken = `focal-${asset.focalPoint.replaceAll('%', '').replace(' ', '-')}`;
      expect(registry).toContain(`'${asset.focalPoint}': '${focalToken}'`);
    }
    expect(css).toContain('.responsive-media.mobile-center-safe');
    expect(css).toContain('.responsive-media.mobile-subject-right');
    expect(css).toContain('.responsive-media.mobile-people-right');
  });

  it('wires all route families to approved media without source-level inline styles', () => {
    const sourceFiles = filesUnder('src').filter((path) =>
      ['.astro', '.ts', '.css'].includes(extname(path)),
    );
    const allSource = sourceFiles.map(source).join('\n');
    expect(allSource).not.toMatch(/\bstyle\s*=/i);
    expect(allSource).not.toMatch(
      /https?:\/\/[^'"\s]+\.(?:png|jpe?g|webp|avif)/i,
    );

    const routeCoverage = [
      ['src/pages/index.astro', 'HOME-gathering-hero'],
      ['src/pages/index.astro', 'HOME-editorial-banner'],
      ['src/pages/recipes/index.astro', 'SYS_RECIPES-hero'],
      ['src/pages/guides/index.astro', 'SYS_GUIDES-hero'],
      ['src/pages/menus/index.astro', 'SYS_MENUS-hero'],
      ['src/pages/start-here.astro', 'SYS_START-hero'],
      ['src/pages/tools/index.astro', 'SYS_TOOLS-hero'],
      ['src/pages/shop/index.astro', 'SYS_SHOP-hero'],
      ['src/pages/newsletter/index.astro', 'SYS_NEWSLETTER-hero'],
      ['src/pages/live-class.astro', 'SYS_CLASS-hero'],
      ['src/pages/media-kit.astro', 'SYS_MEDIA_KIT-hero'],
      ['src/pages/brand-partnerships.astro', 'SYS_PARTNERSHIPS-hero'],
      ['src/pages/licensing-inquiry.astro', 'SYS_LICENSING-hero'],
      ['src/pages/affiliate-disclosure.astro', 'POLICY-tabletop-texture'],
      ['src/pages/sponsored-content-policy.astro', 'POLICY-tabletop-texture'],
      ['src/pages/sitemap/index.astro', 'POLICY-tabletop-texture'],
    ] as const;
    for (const [path, id] of routeCoverage) expect(source(path)).toContain(id);
    expect(source('src/components/RecipePage.astro')).toContain(
      'recipe.id}-hero',
    );
    expect(source('src/components/GuidePage.astro')).toContain(
      'guide.id}-hero',
    );
    expect(source('src/pages/menus/[guests].astro')).toContain('menu.id}-hero');
    expect(source('src/pages/recipes/[category]/index.astro')).toContain(
      'category.id}-hero',
    );
  });

  it('emits complete social-image metadata while preserving preview noindex', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const home = source('src/pages/index.astro');
    expect(layout).toContain('og:image:width');
    expect(layout).toContain('og:image:height');
    expect(layout).toContain('og:image:alt');
    expect(layout).toContain('summary_large_image');
    expect(layout).toContain('twitter:image:alt');
    expect(layout).toContain('noindex,nofollow,noarchive');
    expect(home).toContain('socialImageWidth={1200}');
    expect(home).toContain('socialImageHeight={630}');
    expect(existsSync(resolve(root, 'public/social/kbbqguide-home.jpg'))).toBe(
      true,
    );
  });

  it('records the inventory, disclosure, review boundary, and QA artifacts', () => {
    const csv = source('docs/media-assets-phase9.csv').trim().split('\n');
    expect(csv).toHaveLength(116);
    for (const path of [
      'docs/MEDIA-HUMAN-REVIEW.md',
      'docs/MEDIA-PRODUCTION-QUEUE.md',
      'docs/PHASE-9-VISUAL-EDITORIAL-HANDOFF.md',
      'docs/PHASE-9-BROWSER-QA.md',
    ])
      expect(existsSync(resolve(root, path))).toBe(true);
  });
});
