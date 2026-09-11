import { createHash } from 'node:crypto';
import type { Buffer } from 'node:buffer';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../data/media-manifest.json';
import inventory from '../data/recipe-inventory.json';

const imported = manifest.assets.filter((asset) => 'sourceImport' in asset);
const digest = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

describe('Native recipe photo integration', () => {
  it('binds each imported JPEG and stable hero to exactly one inventoried recipe', () => {
    expect(imported.length).toBeGreaterThan(0);
    const hashes = new Set<string>();
    const byId = new Map(
      manifest.assets.map((asset) => [asset.assetId, asset]),
    );
    for (const asset of imported) {
      if (!('sourceImport' in asset) || !asset.sourceImport)
        throw new Error('Missing evidence');
      const record = inventory.recipes.find(
        (recipe) => recipe.id === asset.provenance.sourceRecord,
      );
      expect(record).toBeDefined();
      expect(asset.assetId).toMatch(new RegExp(`^${record!.id}-hero-r\\d+$`));
      expect(record!.canonicalUrl).toBe(
        `https://kbbqguide.com/recipes/${record!.category}/${record!.slug}/`,
      );
      expect(digest(readFileSync(asset.path))).toBe(
        asset.sourceImport.masterSha256,
      );
      expect(hashes.has(asset.sourceImport.sha256)).toBe(false);
      hashes.add(asset.sourceImport.sha256);
      expect(asset.sourceImport.evidence.length).toBeGreaterThan(50);
      expect(asset.altDecision).toBe('informative');
      expect(asset.altText.length).toBeGreaterThan(20);
      expect(asset.provenance.disclosure).toContain('AI-generated');
      expect(asset.assetStatus).toBe('synthetic-labeled');
      expect(asset.humanEditorialReview.status).toBe('required');
      expect('waiver' in asset.humanEditorialReview).toBe(false);
      expect(
        Object.values(asset.humanEditorialReview.lanes).every(
          (lane) => lane.decision === '',
        ),
      ).toBe(true);
      expect(asset.width).toBe(asset.sourceImport.width);
      expect(asset.height).toBe(asset.sourceImport.height);
      expect(asset.imageFit).toBe('contain');
      let resolved = byId.get(`${record!.id}-hero`);
      const seen = new Set<string>();
      while (resolved?.status === 'replaced') {
        expect(seen.has(resolved.assetId)).toBe(false);
        seen.add(resolved.assetId);
        expect(resolved.provenance.sourceRecord).toBe(record!.id);
        resolved = byId.get(resolved.replacedBy!);
      }
      expect(resolved?.assetId).toBe(asset.assetId);
    }
  });

  it('rejects duplicate IDs, cross-dish metadata, wrong originals, and implicit size changes without writes', () => {
    const asset = imported.find(
      (entry) => entry.sourceImport?.mimeType === 'image/jpeg',
    )!;
    const dir = mkdtempSync(join(tmpdir(), 'kbbq-photo-ingest-'));
    const metadata = join(dir, 'metadata.json');
    const before = readFileSync('data/media-manifest.json');
    const base = [
      'scripts/media-ingest.mjs',
      asset.path,
      '--supersedes',
      asset.assetId,
      '--original',
      asset.path,
      '--metadata',
      metadata,
      '--dry-run',
    ];
    try {
      writeFileSync(metadata, JSON.stringify(asset));
      expect(execFileSync('node', base, { encoding: 'utf8' })).toContain(
        'DRY RUN OK',
      );
      expect(
        spawnSync('node', [...base, '--id', 'M01-hero'], { encoding: 'utf8' })
          .stderr,
      ).toContain('duplicate asset id');
      writeFileSync(
        metadata,
        JSON.stringify({
          ...asset,
          provenance: { ...asset.provenance, sourceRecord: 'NOT-THE-DISH' },
        }),
      );
      expect(spawnSync('node', base, { encoding: 'utf8' }).stderr).toContain(
        'exact replaced recipe',
      );
      writeFileSync(
        metadata,
        JSON.stringify({
          ...asset,
          sourceImport: { ...asset.sourceImport, sha256: '0'.repeat(64) },
        }),
      );
      expect(spawnSync('node', base, { encoding: 'utf8' }).stderr).toContain(
        'checksum',
      );
      expect(
        spawnSync(
          'node',
          [
            'scripts/media-ingest.mjs',
            asset.path,
            '--supersedes',
            'F01-hero',
            '--dry-run',
          ],
          { encoding: 'utf8' },
        ).stderr,
      ).toContain('dimensions');
      expect(readFileSync('data/media-manifest.json').equals(before)).toBe(
        true,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
