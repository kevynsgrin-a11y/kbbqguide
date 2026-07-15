import { describe, expect, it } from 'vitest';

import registryData from '../data/url-registry.json';
import {
  normalizeSlug,
  registryPathById,
  validateUrlRegistry,
  type UrlRegistry,
} from '../src/lib/url-registry';

const registry = registryData as UrlRegistry;

describe('slug and URL registry', () => {
  it('normalizes human titles to lowercase ASCII kebab-case', () => {
    expect(normalizeSlug('  Ssam Greens, Herbs & Wraps!  ')).toBe(
      'ssam-greens-herbs-wraps',
    );
    expect(normalizeSlug('Yuja Crème?draft=true#top')).toBe('yuja-creme');
  });

  it('rejects empty and reserved slugs', () => {
    expect(() => normalizeSlug('---')).toThrow(/empty/i);
    expect(() => normalizeSlug('admin')).toThrow(/reserved/i);
  });

  it('looks up internal paths by immutable ID', () => {
    expect(registryPathById(registry, 'CAT_BANCHAN')).toBe('/recipes/banchan/');
    expect(() => registryPathById(registry, 'FREE_TEXT')).toThrow(
      /Expected one/,
    );
  });

  it('has no registry collisions or canonical errors', () => {
    expect(validateUrlRegistry(registry)).toEqual([]);
  });
});
