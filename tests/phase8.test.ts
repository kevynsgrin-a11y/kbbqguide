import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import affiliateData from '../data/affiliate-registry.json';
import mediaData from '../data/media-manifest.json';
import stateData from '../project-state.json';

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

describe('Phase 8 final operational handoff gate', () => {
  it('includes every required Phase 8 handoff artifact', () => {
    const required = [
      'docs/FINAL-BUILD-REPORT.md',
      'docs/FINAL-FILE-MANIFEST.md',
      'docs/final-file-manifest.sha256',
      'docs/HUMAN-REVIEW-QUEUE.md',
      'docs/AFFILIATE-VERIFICATION-QUEUE.md',
      'docs/MEDIA-PRODUCTION-QUEUE.md',
      'docs/DEPLOYMENT-RUNBOOK.md',
      'docs/ROLLBACK-RUNBOOK.md',
      'docs/30-60-90-OPERATING-CHECKLIST.md',
      'docs/PHASE-8-FINAL-HANDOFF.md',
    ];
    for (const path of required)
      expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('keeps all 80 recipe drafts in the human review queue', () => {
    const queue = source('docs/HUMAN-REVIEW-QUEUE.md');
    expect(queue).toContain('80 of 80');
    expect(queue).toContain('test-kitchen');
    expect(queue).toContain('food-safety');
    expect(queue).toContain('Korean-language');
    expect(queue).toContain('cultural');
  });

  it('maps all nine inactive merchants into the verification queue', () => {
    const queue = source('docs/AFFILIATE-VERIFICATION-QUEUE.md');
    expect(affiliateData.merchants).toHaveLength(9);
    for (const merchant of affiliateData.merchants) {
      expect(merchant.status).not.toBe('active');
      expect(queue).toContain(merchant.id);
    }
  });

  it('maps all 80 placeholder recipe plans into the media queue', () => {
    const queue = source('docs/MEDIA-PRODUCTION-QUEUE.md');
    expect(mediaData.recipePlans).toHaveLength(80);
    expect(mediaData.assets).toHaveLength(0);
    expect(queue).toContain('80 recipe plans');
    expect(queue).toContain('1,040');
    expect(queue).toContain('docs/media-production-plan.csv');
  });

  it('gates deployment on explicit authorization and a passing release candidate', () => {
    const runbook = source('docs/DEPLOYMENT-RUNBOOK.md');
    expect(runbook).toMatch(/explicit.*release authorization/is);
    expect(runbook).toContain('npm ci');
    expect(runbook).toContain('npm run check');
    expect(runbook).toContain('npm run audit');
    expect(runbook).toContain('dist');
    expect(runbook).toMatch(/preview/i);
  });

  it('defines a production rollback path and post-rollback verification', () => {
    const runbook = source('docs/ROLLBACK-RUNBOOK.md');
    expect(runbook).toContain('Rollback to this deployment');
    expect(runbook).toMatch(
      /preview deployments are not valid rollback targets/i,
    );
    expect(runbook).toMatch(/post-rollback/i);
  });

  it('defines measurable 30, 60, and 90 day operating checkpoints', () => {
    const checklist = source('docs/30-60-90-OPERATING-CHECKLIST.md');
    expect(checklist).toContain('Days 1–30');
    expect(checklist).toContain('Days 31–60');
    expect(checklist).toContain('Days 61–90');
    expect(checklist).toMatch(/do not infer consent/i);
  });

  it('keeps source free of remote runtime and active collection primitives', () => {
    const clientSource = filesUnder('src')
      .filter((file) => ['.astro', '.ts'].includes(extname(file)))
      .map(source)
      .join('\n');
    expect(clientSource).not.toMatch(
      /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie/,
    );
    expect(stateData.phase8.productionDeployment).toBe(false);
    expect(stateData.phase8.humanApprovalsInferred).toBe(false);
  });

  it('records the final build phase complete without claiming release approval', () => {
    expect(stateData.currentPhase).toBe(8);
    expect(stateData.phaseStatus).toBe('complete');
    expect(stateData.phase8).toMatchObject({
      operationalHandoffComplete: true,
      humanReviewQueueStatus: 'open',
      affiliateVerificationQueueStatus: 'open',
      mediaProductionQueueStatus: 'open',
      productionDeployment: false,
      publicReleaseAuthorized: false,
    });
    expect(stateData.nextCommand).toMatch(/explicit.*release authorization/is);
  });
});
