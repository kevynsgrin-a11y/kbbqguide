# Final File Manifest

Checkpoint date: 2026-08-23

## Scope

`docs/final-file-manifest.sha256` is the authoritative integrity inventory for
this release candidate. It records every tracked project file except the
checksum file itself, which cannot safely hash itself. Generated `dist/`,
`.astro/`, `node_modules/`, local caches, operating-system metadata, and the
external ZIP archive are not source-handoff files and are excluded.

Final source inventory: **471 tracked files; 470 SHA-256 entries; one
self-excluded checksum file**.

## Verify

From the project root, run:

```bash
sha256sum --check docs/final-file-manifest.sha256
```

Expected result: 470 `OK` records and zero failed checks. Then run:

```bash
npm ci
npm run check
npm run audit
```

The checksum verification proves byte-level source integrity. The build and test commands prove the operational contracts. Neither substitutes for the open human release gates.

## Change control

Any source change after this checkpoint invalidates at least one checksum and
creates a new release candidate. Regenerate the complete manifest, repeat the
entire verification chain, record the new artifact hash, and obtain fresh
release authorization. Never edit a checksum merely to suppress an unexplained
mismatch.
