import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluatePerformanceBudget } from '../scripts/performance-budget.mjs';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');
const policy = JSON.parse(source('data/performance-budget.json'));

function metrics(value = 0) {
  return Object.fromEntries(
    Object.keys(policy.metrics).map((metric) => [metric, value]),
  );
}

describe('P2 #16 production performance budget', () => {
  it('encodes every audit budget with a 10% regression rule', () => {
    expect(policy.status).toBe('enforced');
    expect(policy.maxRegressionPercent).toBe(10);
    expect(policy.metrics).toMatchObject({
      compressedHtmlBytes: { limitBytes: 15 * 1024 },
      sharedCssUncompressedBytes: { limitBytes: 40 * 1024 },
      firstPartyJavaScriptCompressedBytes: { limitBytes: 25 * 1024 },
      thirdPartyJavaScriptCompressedBytes: { limitBytes: 50 * 1024 },
      mobileHeroImageBytes: { limitBytes: 35 * 1024 },
      desktopHeroImageBytes: { limitBytes: 120 * 1024 },
    });
  });

  it('executes the policy test and emitted-artifact validator in every build', () => {
    const validator = source('scripts/validate-built-preview.mjs');
    const packageJson = JSON.parse(source('package.json'));
    expect(validator).toContain("from './performance-budget.mjs'");
    expect(validator).toContain('evaluatePerformanceBudget({');
    expect(packageJson.scripts.build).toContain(
      'tests/p2-performance-budget.test.ts',
    );
    expect(packageJson.scripts.build).toContain('npm run validate:preview');
  });

  it('fails a regression without a recorded signed exception', () => {
    const result = evaluatePerformanceBudget({
      policy,
      metrics: {
        ...metrics(),
        compressedHtmlBytes:
          Math.floor(policy.metrics.compressedHtmlBytes.baselineBytes * 1.1) +
          1,
      },
      now: new Date('2026-08-23T00:00:00.000Z'),
    });
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.metric).toBe('compressedHtmlBytes');
  });

  it('accepts only a complete, unexpired signed exception scoped to the metric', () => {
    const actualBytes = 12_000;
    const result = evaluatePerformanceBudget({
      policy: {
        ...policy,
        signedExceptions: [
          {
            id: 'PERF-2026-001',
            metrics: ['compressedHtmlBytes'],
            maxBytes: { compressedHtmlBytes: actualBytes },
            rationale: 'A temporary audited editorial launch experiment.',
            signedBy: 'Performance owner',
            signedAt: '2026-08-23T00:00:00.000Z',
            approvalReference: 'PR-123',
            expiresAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      },
      metrics: { ...metrics(), compressedHtmlBytes: actualBytes },
      now: new Date('2026-08-23T00:00:00.000Z'),
    });
    expect(result.failures).toHaveLength(0);
    expect(result.exceptionsUsed).toEqual([
      expect.objectContaining({
        metric: 'compressedHtmlBytes',
        exceptionId: 'PERF-2026-001',
      }),
    ]);
  });

  it('does not permit an exception to waive a hard byte ceiling', () => {
    const actualBytes = policy.metrics.compressedHtmlBytes.limitBytes + 1;
    const result = evaluatePerformanceBudget({
      policy: {
        ...policy,
        signedExceptions: [
          {
            id: 'PERF-2026-002',
            metrics: ['compressedHtmlBytes'],
            maxBytes: { compressedHtmlBytes: actualBytes },
            rationale: 'This record must not waive the absolute ceiling.',
            signedBy: 'Performance owner',
            signedAt: '2026-08-23T00:00:00.000Z',
            approvalReference: 'PR-124',
            expiresAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      },
      metrics: { ...metrics(), compressedHtmlBytes: actualBytes },
      now: new Date('2026-08-23T00:00:00.000Z'),
    });
    expect(result.failures).toEqual([
      expect.objectContaining({ metric: 'compressedHtmlBytes' }),
    ]);
  });

  it('rejects incomplete and expired exception records', () => {
    const actualBytes = 12_000;
    const baseException = {
      id: 'PERF-2026-003',
      metrics: ['compressedHtmlBytes'],
      maxBytes: { compressedHtmlBytes: actualBytes },
      rationale: 'A scoped regression exception.',
      signedBy: 'Performance owner',
      signedAt: '2026-08-23T00:00:00.000Z',
      approvalReference: 'PR-125',
      expiresAt: '2026-08-22T00:00:00.000Z',
    };
    const expiredResult = evaluatePerformanceBudget({
      policy: { ...policy, signedExceptions: [baseException] },
      metrics: { ...metrics(), compressedHtmlBytes: actualBytes },
      now: new Date('2026-08-23T00:00:00.000Z'),
    });
    expect(expiredResult.failures).toEqual([
      expect.objectContaining({ metric: 'compressedHtmlBytes' }),
    ]);

    const incompleteResult = evaluatePerformanceBudget({
      policy: {
        ...policy,
        signedExceptions: [
          {
            ...baseException,
            signedBy: '',
            expiresAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      },
      metrics: { ...metrics(), compressedHtmlBytes: actualBytes },
      now: new Date('2026-08-23T00:00:00.000Z'),
    });
    expect(incompleteResult.failures).toEqual([
      expect.objectContaining({ metric: 'compressedHtmlBytes' }),
    ]);

    const futureSignatureResult = evaluatePerformanceBudget({
      policy: {
        ...policy,
        signedExceptions: [
          {
            ...baseException,
            signedAt: '2026-08-24T00:00:00.000Z',
            expiresAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      },
      metrics: { ...metrics(), compressedHtmlBytes: actualBytes },
      now: new Date('2026-08-23T00:00:00.000Z'),
    });
    expect(futureSignatureResult.failures).toEqual([
      expect.objectContaining({ metric: 'compressedHtmlBytes' }),
    ]);
  });

  it('keeps the emitted candidate contract bounded to WebP plus JPEG', () => {
    const responsive = source('src/components/ResponsiveMedia.astro');
    expect(responsive).toContain("format: 'webp'");
    expect(responsive).toContain("format: 'jpeg'");
    expect(responsive).not.toContain("format: 'avif'");
    expect(responsive).toContain(
      'const responsiveWidths = [360, 600, 960, 1200]',
    );
    expect(responsive).toContain('src={fallback.src}');
    expect(responsive).toContain('media="(max-width: 600px)"');
    expect(responsive).toContain('sizes="100vw"');
  });
});
