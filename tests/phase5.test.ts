import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import registryData from '../data/url-registry.json';
import stateData from '../project-state.json';
import { guides } from '../src/lib/guides';
import { menus } from '../src/lib/menus';
import { consolidateShoppingList } from '../src/lib/planner';
import {
  breadcrumbJsonLd,
  canonicalUrl,
  itemListJsonLd,
  recipeJsonLd,
} from '../src/lib/seo';
import type { UrlRegistry } from '../src/lib/url-registry';
import { recipeSchema, type CompleteRecipe } from '../src/schemas/recipe';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');
const registry = registryData as UrlRegistry;
const recipes = registry.entries
  .filter((entry) => entry.type === 'recipe')
  .map((entry) => {
    const file = `${entry.id.toLowerCase()}.json`;
    const parsed = recipeSchema.parse(
      JSON.parse(source(`src/content/recipes/${file}`)),
    );
    if (parsed.contentStatus !== 'complete')
      throw new Error(`Expected complete recipe ${entry.id}`);
    return parsed as CompleteRecipe;
  });

describe('Phase 5 SEO, guides, menus, and tools handoff gate', () => {
  it('locks twelve distinct substantive guide drafts to the reserved guide IDs', () => {
    expect(guides).toHaveLength(12);
    expect(guides.map((guide) => guide.id)).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `G${String(index + 1).padStart(2, '0')}`,
      ),
    );
    expect(new Set(guides.map((guide) => guide.title)).size).toBe(12);
    for (const guide of guides) {
      expect(guide.sections).toHaveLength(4);
      expect(
        guide.sections.every((section) => section.checklist.length >= 3),
      ).toBe(true);
      expect(guide.safetyNote.length).toBeGreaterThan(70);
      expect(registry.entries.some((entry) => entry.id === guide.id)).toBe(
        true,
      );
    }
    expect(source('src/pages/guides/[slug].astro')).toContain(
      '<GuidePage {guide}',
    );
  });

  it('provides three workload-aware menus whose recipe links all resolve', () => {
    expect(menus.map((menu) => menu.guests)).toEqual([2, 4, 8]);
    expect(menus.map((menu) => menu.id)).toEqual([
      'MENU_2',
      'MENU_4',
      'MENU_8',
    ]);
    const recipeIds = new Set(recipes.map((recipe) => recipe.id));
    for (const menu of menus) {
      expect(menu.recipeIds.length).toBeGreaterThanOrEqual(5);
      expect(menu.recipeIds.every((id) => recipeIds.has(id))).toBe(true);
      expect(menu.serviceOrder.length).toBeGreaterThanOrEqual(4);
      expect(menu.equipment.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('consolidates scaled recipe quantities deterministically without prices or packages', () => {
    const selected = recipes.filter((recipe) =>
      ['M01', 'F01'].includes(recipe.id),
    );
    const list = consolidateShoppingList(selected, 8);
    expect(list.length).toBeGreaterThan(10);
    expect(list.every((line) => line.recipeIds.length > 0)).toBe(true);
    expect(list.some((line) => line.display !== '')).toBe(true);
    expect(JSON.stringify(list)).not.toMatch(/price|stock|coupon|package/i);
    expect(() => consolidateShoppingList(selected, 0)).toThrow(
      /positive integer/,
    );
  });

  it('implements all seven progressive tools with local data and no-JavaScript fallbacks', () => {
    const tools = source('src/components/PlannerTools.astro');
    expect(tools.match(/data-quantity-scaler/g)).toHaveLength(3);
    expect(tools).toContain('data-menu-select');
    expect(tools).toContain('data-shopping-list');
    expect(tools).toContain('data-timeline-select');
    expect(tools).toContain('equipment-checklist');
    expect(tools).toContain('data-allergen-filter');
    expect(tools).toContain('cannot guarantee');
    expect(tools.match(/<noscript>/g)?.length).toBeGreaterThanOrEqual(3);
    expect(tools).not.toMatch(/fetch\(|localStorage|sessionStorage/);
  });

  it('builds preview-safe canonicals and honest Recipe, BreadcrumbList, and ItemList JSON-LD', () => {
    expect(canonicalUrl('/guides/')).toBe('https://kbbqguide.com/guides/');
    expect(() => canonicalUrl('/unsafe/../path/')).toThrow(/unsafe/i);
    const recipe = recipes[0];
    expect(recipe).toBeTruthy();
    if (!recipe) return;
    const data = recipeJsonLd(
      recipe,
      registry.entries.find((entry) => entry.id === recipe.id)!.path,
    );
    expect(data['@type']).toBe('Recipe');
    expect(data.recipeIngredient.length).toBeGreaterThan(0);
    expect(data.recipeInstructions.length).toBeGreaterThan(0);
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('review');
    expect(data).not.toHaveProperty('nutrition');
    expect(data).not.toHaveProperty('image');
    expect(data).not.toHaveProperty('video');
    expect(breadcrumbJsonLd([{ name: 'Home', path: '/' }])['@type']).toBe(
      'BreadcrumbList',
    );
    expect(
      itemListJsonLd('Example', [{ name: 'Home', path: '/' }])['@type'],
    ).toBe('ItemList');
  });

  it('emits every preview discovery artifact while blocking indexing and publication claims', () => {
    for (const file of [
      'src/pages/robots.txt.ts',
      'src/pages/sitemap.xml.ts',
      'src/pages/sitemap-index.xml.ts',
      'src/pages/feed.xml.ts',
      'src/pages/site.webmanifest.ts',
      'src/pages/404.astro',
      'src/pages/sitemap/index.astro',
      'public/favicon.svg',
    ])
      expect(existsSync(resolve(root, file)), file).toBe(true);
    expect(source('src/pages/robots.txt.ts')).toContain('Allow: /');
    expect(source('src/pages/robots.txt.ts')).toContain('sitemap.xml');
    expect(source('src/pages/sitemap.xml.ts')).toContain('isRecipePublishable');
    expect(existsSync(resolve(root, 'src/pages/sitemap-preview.xml.ts'))).toBe(
      false,
    );
    expect(source('src/pages/feed.xml.ts')).toContain('no entries');
    expect(source('src/layouts/BaseLayout.astro')).toContain(
      'noindex,nofollow,noarchive',
    );
  });

  it('expands navigation only to implemented registry routes', () => {
    expect(registry.entries.length).toBeGreaterThanOrEqual(121);
    expect(
      registry.entries.filter((entry) => entry.type === 'recipe'),
    ).toHaveLength(80);
    for (const id of [
      'SYS_START',
      'SYS_GUIDES',
      'SYS_MENUS',
      'MENU_2',
      'MENU_4',
      'MENU_8',
      'SYS_TOOLS',
      'SYS_SITEMAP',
    ])
      expect(registry.entries.filter((entry) => entry.id === id)).toHaveLength(
        1,
      );
    const header = source('src/components/Header.astro');
    expect(header).not.toContain('href: null');
    expect(header).toContain("'SYS_TOOLS'");
  });

  it('records Phase 5 complete without approving drafts or deployment', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(5);
    expect(stateData.phaseStatus).toBe('complete');
    expect(stateData.editorialStatusCounts).toMatchObject({
      draft: 80,
      approved: 0,
      published: 0,
    });
    expect(stateData.phase5).toMatchObject({
      guides: 12,
      menuPages: 3,
      totalStaticHtmlPages: 108,
      recipeStructuredDataPages: 80,
      previewRobotsDisallowAll: true,
      productionDeployment: false,
    });
    expect(stateData.nextCommand).toMatch(/do not publish/i);
  });
});
