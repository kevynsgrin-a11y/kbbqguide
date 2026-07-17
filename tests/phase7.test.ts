import { readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import affiliateData from '../data/affiliate-registry.json';
import analyticsData from '../data/analytics-event-registry.json';
import automationData from '../data/automation-registry.json';
import allowlistData from '../data/outbound-domain-allowlist.json';
import revenueData from '../data/revenue-modules.json';
import stateData from '../project-state.json';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

function filesUnder(relative: string): string[] {
  const absolute = resolve(root, relative);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = `${relative}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}

describe('Phase 7 full QA and hardening gate', () => {
  it('emits a narrow Cloudflare Pages security policy without unsafe script or style escape hatches', () => {
    const headers = source('public/_headers');
    expect(headers).toContain("default-src 'self'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("form-action 'self'");
    expect(headers).toContain("connect-src 'self'");
    expect(headers).toContain("script-src-attr 'none'");
    expect(headers).toContain("style-src-attr 'none'");
    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain('Permissions-Policy:');
    expect(headers).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(headers).not.toContain('Strict-Transport-Security');
    expect(headers.match(/'sha256-/g)).toHaveLength(3);
  });

  it('makes security-header and Phase 7 validation part of every build', () => {
    const packageData = JSON.parse(source('package.json')) as {
      scripts: Record<string, string>;
    };
    expect(packageData.scripts.build).toMatch(/validate:phase(?:7|8|9)/);
    expect(packageData.scripts.build).toContain('validate:headers');
    expect(packageData.scripts['validate:headers']).toContain(
      'validate-security-headers.mjs',
    );
  });

  it('finds no production secret pattern in source-of-truth, configuration, data, or public files', () => {
    const files = [
      '.env.example',
      ...filesUnder('src'),
      ...filesUnder('data'),
      ...filesUnder('public'),
    ].filter(
      (file) =>
        file === '.env.example' ||
        ['.astro', '.css', '.json', '.ts', ''].includes(extname(file)),
    );
    const secretPatterns = [
      /sk-[A-Za-z0-9_-]{20,}/,
      /AKIA[0-9A-Z]{16}/,
      /AIza[0-9A-Za-z_-]{30,}/,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /Bearer\s+[A-Za-z0-9._-]{20,}/,
    ];
    for (const file of files) {
      const content = source(file);
      for (const pattern of secretPatterns)
        expect(content, file).not.toMatch(pattern);
    }
  });

  it('contains no client data transmission, persistent storage, cookie, or remote runtime primitive', () => {
    const clientSource = filesUnder('src')
      .filter((file) => ['.astro', '.ts'].includes(extname(file)))
      .map(source)
      .join('\n');
    expect(clientSource).not.toMatch(
      /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|document\.cookie/,
    );
    expect(clientSource).not.toMatch(/<script[^>]+src=["']https?:/);
  });

  it('preserves every commercial, collection, and tracking kill switch', () => {
    expect(allowlistData.allowedDomains).toEqual([]);
    expect(
      affiliateData.merchants.every((merchant) => merchant.status !== 'active'),
    ).toBe(true);
    expect(
      revenueData.modules.every((module) => module.status === 'disabled'),
    ).toBe(true);
    expect(
      revenueData.adSlots.every((slot) => slot.status === 'disabled'),
    ).toBe(true);
    expect(automationData.collectionEnabled).toBe(false);
    expect(automationData.providersConfigured).toBe(false);
    expect(analyticsData.collectionEnabled).toBe(false);
    expect(analyticsData.provider).toBeNull();
  });

  it('keeps named landmarks, skip navigation, and the permanent preview banner out of live regions', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const header = source('src/components/Header.astro');
    const footer = source('src/components/Footer.astro');
    const tools = source('src/components/PlannerTools.astro');
    expect(layout).toContain('class="skip-link"');
    expect(layout).toContain('<main id="main-content"');
    expect(layout).not.toMatch(/preview-strip[^>]+role="status"/);
    expect(header).toContain('aria-label="Primary navigation"');
    expect(header).toContain('aria-label="Mobile navigation"');
    expect(footer).toContain('<footer');
    expect(footer).toContain(
      '<nav class="footer-links" aria-label="Recipe links"',
    );
    expect(footer).toContain(
      '<nav class="footer-links" aria-label="Policy and standards routes"',
    );
    expect(tools).toMatch(/data-shopping-list\s+tabindex="0"/);
    expect(tools).toContain('aria-label="Consolidated shopping list"');
  });

  it('retains reduced-motion, reflow, print, focus, and touch-target safeguards', () => {
    const css = source('src/styles/global.css');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation-duration: 0.01ms !important');
    expect(css).toContain('@media print');
    expect(css).toMatch(/\.skip-link:focus/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toContain('@media (max-width: 42rem)');
    expect(css).toMatch(/\.shopping-line small[\s\S]+overflow-wrap: anywhere/);
    expect(css).toMatch(/\.shopping-line[\s\S]+flex-direction: column/);
  });

  it('records every discovered defect and closes all critical and high items', () => {
    const log = source('docs/PHASE-7-DEFECT-LOG.md');
    expect(log).toContain('P7-H-001');
    expect(log).toContain('P7-H-002');
    expect(log).toContain('P7-H-003');
    expect(log).toContain('P7-M-001');
    expect(log).toContain('P7-L-001');
    expect(log).toContain('Unresolved critical defects: **0**');
    expect(log).toContain('Unresolved high-severity defects: **0**');
    expect(log).not.toMatch(
      /\| (?:Critical|High) \|[^\n]+\| (?:Open|Unresolved) \|/,
    );
  });

  it('records Phase 7 complete with zero unresolved critical/high defects and no deployment', () => {
    expect(stateData.currentPhase).toBeGreaterThanOrEqual(7);
    expect(stateData.phaseStatus).toBe('complete');
    expect(stateData.phase7).toMatchObject({
      viewportRouteChecks: 40,
      viewportRouteChecksPassed: 40,
      accessibilityRuleRuns: 20,
      accessibilityViolations: 0,
      defectsDiscovered: 5,
      defectsRepaired: 5,
      unresolvedCriticalDefects: 0,
      unresolvedHighDefects: 0,
      productionDeployment: false,
    });
    expect(stateData.nextCommand).toMatch(/explicit/i);
    expect(stateData.nextCommand).toMatch(/do not publish|before.*deploy/i);
  });
});
