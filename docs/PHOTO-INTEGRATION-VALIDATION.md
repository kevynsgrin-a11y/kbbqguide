# Photo integration validation — 2026-09-11

Prepared by the Codex photo integration agent. Human review is not inferred.

## Candidate and source accounting

- Runtime candidate: `98f5aef3d101594260906e6663cc17d54cab2112`.
- Repository baseline: `d3afa84a751eb31890880bb0e6382cb403b0d6b6`, fetched after
  a nutrition-data update landed during the task. The photo branch was rebased
  onto it without changing those updates.
- Draft PR: <https://github.com/kevynsgrin-a11y/kbbqguide/pull/9>.
- Source folder: 42 files, 40 distinct SHA-256 hashes, 2 exact duplicates,
  no subfolders. All sources were downloaded and visually inspected.
- Installed: 34 distinct synthetic images across 34 dishes. Six sources remain
  unresolved. Four need identification; two depict nut garnishes absent from
  the corresponding recipes. No currently confirmed distinct images share a
  dish, so no gallery was needed.
- Complete local source inventory and mapping:
  `../photo-audit/photo-to-dish-mapping.csv`, `.json`, and `.md`. These include
  every Drive file ID, original dimensions, checksum, disposition, recipe,
  canonical route, installed path, and matching evidence.

## Passing verification

- `npm ci`: completed with the lockfile unchanged.
- Unit and integration tests: 210 passed.
- ESLint: passed.
- Astro generation and the post-generation test suite completed. The full
  `npm run build` still fails its later preview validator, described below.
- Photo browser audit: 124 routes, 102 matching hero/card placements, zero
  placement errors; sourceRecord, title, canonical route, link, alt text,
  loading priority, and full-frame presentation checked.
- Image requests: 894 unique rendered URLs returned image responses and were
  fully decoded; 246 are derivatives of the 34 imported masters. No HTML error
  body was accepted as an image. All mobile source widths stay at or below 600;
  imported mobile responses maxed at 59,200 bytes and desktop at 170,039 bytes.
- 68 dedicated hero screenshots (34 dishes at 1440 and 390 pixels) were captured
  and visually inspected through six paired contact sheets. Mobile disclosure
  clipping was found and fixed; all new hero credits now fit their frames at
  readable sizes. Browser source-swap/navigation aborts were recorded separately;
  the same URLs passed independent HTTP and full-decoding checks.
- Existing structural/axe suite: 124/124 routes passed, zero failed routes.
- Existing screenshot matrix: 90 captures across 18 routes and 5 widths.
- Existing disclosure audit: 23 synthetic disclosure elements, zero failures.
- Publication, search/indexing, commercial, tracking, and schema/social image
  eligibility settings remain unchanged. Public category/index pages continue
  to hide unapproved recipes; direct draft pages and related draft cards retain
  their existing preview behavior.

## Existing blockers and required review

- `npm run check` stops on formatting in `data/ingredient-dictionary.json` and
  `data/ingredient-nutrition.json`. This was reproduced before the photo edits.
- `npm run typecheck` reports an existing group-type mismatch at
  `src/lib/ingredient-nutrition.ts:50`. No photo-code type error was reported.
- `npm run build` fails because the preview validator requires zero outbound
  links while current nutrition sections emit 80 USDA attribution anchors.
  The outbound-domain allowlist was not changed and the validator was not
  weakened to bypass the failure.
- Dependency audit: 11 existing vulnerabilities (3 moderate, 7 high, 1 critical).
  No dependency update was included in the photo integration.
- `lint:content` reports 319 findings in the current output, including nutrition
  decimal gram values rejected by the historical ingredient-measure rule. This
  separate release check remains failing; no findings were waived.
- Every new asset retains empty human review lanes. The old 115-asset waiver
  does not approve these 34 replacements. Review them in the regenerated
  workbench and record actual decisions through the existing review workflow.
- The historical release gate's fixed 116-route coverage assertion is stale
  relative to the current 124-route site; full current-route QA passed. This
  assertion was not silently weakened.

The final `release:check` result is **NOT READY**: media review is 81/115 ready,
content lint fails, and the fixed coverage-count assertion fails. Disclosure,
current production origin, and noindex on all 125 HTML pages pass.

## Deployment and rollback

The existing Pages project is `kbbqguide`, Git-integrated with this repository,
production branch `main`, build command `npm run build`, and output `dist`.
Both `kbbqguide.com` and `www.kbbqguide.com` are bound to it. No hosting project,
DNS, custom-domain binding, or production configuration was changed.

The existing workflow attempted preview deployment
`3e55b9c4-7a9c-4ee6-964e-422b242001fb` for runtime candidate `98f5aef` and reported
**Failure**. Earlier candidate preview `1ac5bf4f-775c-4a3a-b5a2-3f4858c14a5c` also
failed. A failed preview is not a verified live candidate. Production was not
updated by this task.

Read-only live checks on 2026-09-11 covered 39 relevant routes at each of:

- <https://kbbqguide.com>
- <https://b89d528b.kbbqguide.pages.dev>
- <https://a3c5e3a6.kbbqguide.pages.dev>

All 117 route requests returned HTTPS 200 and a primary image from each page
decoded successfully. None of these pages served the new candidate asset IDs.
The July 502 origin failure is therefore historical, not a present outage.

Known-good rollback target recorded at task start:
`b89d528b-5119-491c-aa23-eb860c50ea87`, production, commit
`df285bad9b959c67cc7cca508ae8bad0068af3d1`. It remains available and passed the
39-route/39-image check. The current production deployment changed independently
during this task to `a3c5e3a6-7e37-4dc9-ac55-efa50f52b6d4`; the provider records it
as an ad-hoc dirty-tree deployment associated with `d3afa84`, so commit-only
reproducibility is not claimed for that artifact.

GitHub's read-only branch and rules endpoints reported no enforced protection
or branch rules for `main`. No protection was altered. The draft remains
unmerged, and no failed release check or outstanding review was waived.

Before production: resolve the six source dispositions, record required human
media review, resolve the existing repository checks, rerun the release gate,
verify a successful preview, and release the reviewed candidate through the
existing project. Retain the noindex/publication controls and scoped cache-purge
procedure. Actual-domain verification of the new images remains pending.
