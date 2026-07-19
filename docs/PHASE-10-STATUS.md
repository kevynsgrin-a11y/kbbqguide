# Phase 10 — Draft Readiness Status

_Updated 2026-07-18 on `claude/document-instructions-25h9z9` / draft PR #3. Nothing is released;
all 116 built pages retain `noindex,nofollow,noarchive`._

## Blocker status

| ID    | Blocker                                    | Status                                                              | Evidence                                                                 |
| ----- | ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| P0-1  | Merge / release governance                 | **resolved in code; operator-only action remains**                  | `docs/GOVERNANCE.md`, `scripts/release-check.mjs`                        |
| P0-2  | Apex and `www` return 502                  | **awaiting operator Cloudflare action**                             | `docs/ops/ORIGIN-DIAGNOSIS-2026-07.md`, `project-state.json`             |
| P1-3  | Named human approval for 115 active assets | **awaiting decisions export (0/115)**                               | `review/index.html`, `scripts/review-apply.mjs`                          |
| P1-4  | Browser QA evidence and manual checks      | **automated exact-SHA CI evidence ready; manual gates outstanding** | `.github/workflows/release-readiness.yml`, `docs/PHASE-10-BROWSER-QA.md` |
| P1-5  | G02/G03 safety imagery                     | **replacement candidates implemented; human lanes pending**         | `G02-hero-r1`, `G03-hero-r1`, corrected briefs                           |
| P1-6  | Home raw/cooked/tool separation            | **recommended restage implemented; human lanes pending**            | `HOME-gathering-hero-r1`, `public/social/kbbqguide-home.jpg`             |
| P1-7  | Overclaiming / templated alt text          | **visibility-honest proposals live; human lanes pending**           | `data/media-manifest.json`, `review/data.js`                             |
| P1-8  | Synthetic disclosure size/contrast         | **resolved; exact-SHA audit runs in CI**                            | `scripts/qa/disclosure-audit.mjs`                                        |
| P1-9  | Visible data defects                       | **resolved**                                                        | `scripts/lint-content.mjs`, `tests/phase10.test.ts`                      |
| Added | Duck image conflicts with safe endpoint    | **cooked-through replacement implemented; 74 °C / 165 °F retained** | `M19-hero-r1`, `docs/media-briefs/phase-10/DUCK-ALT.md`                  |

## 2026-07-18 implementation pass

- Added four new 2400×1600 immutable JPEG masters and marked the former records replaced.
- Corrected the crossed G02/G03 generation briefs and their subject/crop metadata.
- Regenerated the 115-active-asset review dataset without duplicate or replaced records.
- Prevented replacement ingest from inheriting human approvals or stale proposal/status fields.
- Updated active/immutable media accounting throughout runtime validation and Phase 4/8/9/10
  regression tests.
- Reworked the QA evidence gate so exact-SHA evidence or evidence followed only by documentation
  commits is accepted, while any later runtime change or dirty runtime tree fails.
- Made PR CI generate and upload 90 responsive screenshots plus sitewide structural/axe and
  disclosure evidence at the checked-out SHA.
- Reduced the responsive encoding set from AVIF/WebP/JPEG to WebP/JPEG after the Cloudflare Pages
  preview exceeded its 20-minute build limit. The same five responsive widths, master JPEG
  fallback, crop metadata, and byte budgets remain, while generated outputs drop from 1,840 to
  1,265.
- Corrected the 320/390px home disclosure/stat overlap and moved narrow-screen editorial-hero
  credits into a dedicated band below the image so safety evidence is not obscured by its caption.

## Local verification

`npm run check` passed on 2026-07-18:

- formatting, ESLint, and Astro type checks: clean;
- 21 test files / 152 tests: passed;
- 116 static pages: built;
- 115 active media assets / 119 immutable records / 1,265 optimized outputs: validated;
- 4,181 internal links checked; content lint: 0 findings;
- 7 security headers and 16 CSP directives validated.

Fresh browser evidence is delegated to the Node 24 GitHub Actions job and then verified again on
the public Cloudflare preview. No live-preview result is claimed until the deployment completes.

## Remaining release gates

1. Operator resolves and records the production origin.
2. A named reviewer exports and applies five-lane decisions for all 115 active assets.
3. Operator completes the real-device, true-zoom, and screen-reader checklist.
4. Operator requests the exact **"Run Phase 10.7"** closing run.
5. After all gates pass, the operator—not an agent—decides whether to merge, deploy production,
   and later authorize indexing in a separate recorded action.
