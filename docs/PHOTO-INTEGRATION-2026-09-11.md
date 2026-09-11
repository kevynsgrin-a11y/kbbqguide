# Native recipe photo import

The 2026-09-11 photo task authorizes integration and deployment to the existing
Cloudflare Pages project. It does not authorize changing recipe publication,
indexing, commercial settings, or human review evidence.

The source audit is kept outside the checkout in `../photo-audit/`. It contains
original bytes, SHA-256 hashes, labeled contact sheets, visual matching evidence,
and every unresolved source. Private Drive account details and source URLs are
not shipped in public page copy. The manifest records only local source labels,
checksums, and attribution needed to audit each installed image.

## Native dimensions and replacement chains

The original ingest mode still requires a real JPEG with the dimensions and
aspect ratio of the active asset it replaces. For user-supplied portrait images,
use the explicit native import mode:

```sh
npm run media:ingest -- prepared.jpg --supersedes M01-hero \
  --original original.png --metadata photo-metadata.json --dry-run
```

Remove `--dry-run` after inspecting the JPEG and its metadata. `--original` and
`--metadata` must be supplied together. The importer verifies original format,
native dimensions, source checksum, and exact recipe association; it rejects
upscaling, cropping, duplicate asset IDs, and cross-dish records. PNG sources
must first be decoded and encoded as actual JPEGs. Metadata supplies visible
alt text, caption, credit, provenance, rights scope, and `sourceImport` evidence.
The original generation date and prompt remain unknown when no generation
record was supplied. Provider attribution is explicitly based on the filename.

Always follow `replacedBy` from the stable `${recipe.id}-hero` slot to the active
asset before ingesting. New revisions are numbered from the stable ID, including
slots that already have revisions. Recipe plans are updated to the active master
while keeping their stable IDs. Runtime resolution rejects broken chains, cycles,
and cross-record replacements. `imageManifestIds` stays empty where recipes have
no approved real image eligible for public structured data.

Portrait imports retain the complete frame with `object-fit: contain`. Other
media keep their existing focal-point/mobile-crop behavior. WebP/JPEG quality and
the 360/600/960/1200 delivery ceilings remain unchanged; a smaller source ends at
its actual pixel width. No derivative invents resolution beyond its source.

New images receive fresh synthetic provenance and empty human review lanes. No
old waiver, approval, or visual-screening claim is inherited. The review
workbench is regenerated with current active IDs. Synthetic images remain
ineligible for approved Recipe JSON-LD and social-card image claims.

## Validation and release

`tests/photo-import.test.ts` checks source-to-recipe associations, master hashes,
native dimensions, stable-slot resolution, empty review lanes, and rejection of
unsafe imports without writes. Historical media tests retain their legacy master
requirements and separately enforce the native import evidence contract.

At initial inspection the repository already failed formatting on two nutrition
data files, type checking in `src/lib/ingredient-nutrition.ts`, and the built
preview validator because 80 USDA attribution links conflict with its zero-link
assertion. These are separate from this photo change. The required release gate
also requires current browser evidence and human media review. A successful Astro
render is not reported as a passing full build or release authorization.
