import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import registryData from '../data/url-registry.json';
import { validateUrlRegistry, type UrlRegistry } from '../src/lib/url-registry';

const root = resolve(import.meta.dirname, '..');
const registry = registryData as UrlRegistry;
const requiredDocuments = [
  'docs/PROJECT-BRIEF.md',
  'docs/DECISIONS.md',
  'docs/RISK-REGISTER.md',
  'docs/INFORMATION-ARCHITECTURE.md',
  'docs/URL-POLICY.md',
  'docs/url-registry.csv',
  'docs/RECIPE-EDITORIAL-STANDARD.md',
  'docs/test-kitchen-log-template.md',
  'docs/FOOD-SAFETY-STANDARD.md',
  'docs/CULTURAL-REVIEW-CHECKLIST.md',
  'docs/DESIGN-SYSTEM.md',
  'docs/ACCESSIBILITY-CHECKLIST.md',
  'docs/PERFORMANCE-BUDGET.md',
  'docs/SECURITY-PRIVACY-THREAT-MODEL.md',
  'docs/QA-AND-HANDOFF.md',
  'project-state.json',
];

describe('Phase 0 and Phase 1 gate', () => {
  it('contains every required Phase 0–1 source-of-truth document', () => {
    for (const file of requiredDocuments)
      expect(existsSync(resolve(root, file)), file).toBe(true);
  });

  it('locks a collision-free, trailing-slash URL registry', () => {
    expect(registry.trailingSlash).toBe('always');
    expect(validateUrlRegistry(registry)).toEqual([]);
    expect(
      registry.entries.filter((entry) => entry.type !== 'recipe'),
    ).toHaveLength(46);
  });

  it('keeps the CSV registry view in row parity with JSON', () => {
    const rows = readFileSync(resolve(root, 'docs/url-registry.csv'), 'utf8')
      .trim()
      .split('\n');
    expect(rows).toHaveLength(registry.entries.length + 1);
  });

  it('keeps every later-phase page behind the shared unindexable preview layout', () => {
    const page = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
    const layout = readFileSync(
      resolve(root, 'src/layouts/BaseLayout.astro'),
      'utf8',
    );
    expect(page).toContain('BaseLayout');
    expect(layout).toContain('noindex,nofollow,noarchive');
    expect(layout).toContain('KBBQGuide editorial preview');
  });

  it('has no production secrets or invented real placeholder values in the sample environment', () => {
    const env = readFileSync(resolve(root, '.env.example'), 'utf8');
    expect(env).toContain('https://kbbqguide.com');
    expect(env).not.toMatch(/(sk-|ghp_|AKIA)[A-Za-z0-9]/);
  });
});
