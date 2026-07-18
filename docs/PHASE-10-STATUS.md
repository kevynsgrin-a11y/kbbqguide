# Phase 10 — Status Report (§11 checkpoint)

**HEAD at this report:** `07cc0ea` (branch `claude/document-instructions-25h9z9`, DRAFT PR #3).
**Base:** `f2a8cc2` (Phase 9 / PR #2 merge). **Nothing is released; every page is `noindex`.**

## Blocker-by-blocker status

| ID   | Blocker                                            | Status                                                                                                                      | Evidence                                                                                                  |
| ---- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P0-1 | Unauthorized merge / governance drift              | **resolved** (recorded + hardened)                                                                                          | `docs/GOVERNANCE.md`, `project-state.governanceIncident`                                                  |
| P0-2 | Apex origin 502                                    | **tooled-awaiting-operator** (diagnosed read-only; operator fixes in Cloudflare)                                            | `docs/ops/ORIGIN-DIAGNOSIS-2026-07.md`                                                                    |
| P1-3 | 115 assets lack named human approval               | **tooled-awaiting-operator** (workbench built; operator runs review)                                                        | `review/index.html`, `npm run review:apply`, `docs/MEDIA-HUMAN-REVIEW.md`                                 |
| P1-4 | Browser-QA evidence stale                          | **resolved** (matrix + structural report at recorded HEAD, reproducible)                                                    | `docs/PHASE-10-BROWSER-QA.md`, `qa/phase-10/`                                                             |
| P1-5 | Safety imagery (G02/G03) + alt overclaim           | **resolved (alt) + tooled (image)** — overclaiming alts corrected live now; regen briefs ready for operator                 | `docs/media-briefs/phase-10/G02*,G03*`, manifest `phase10Proposal`                                        |
| P1-6 | Home hero raw/cooked/tool separation               | **tooled-awaiting-operator** (brief + interim honesty shipped; operator decides restage vs approve)                         | `docs/media-briefs/phase-10/HOME-HERO-restage.md`                                                         |
| P1-7 | All 80 recipe alts identically templated           | **resolved (proposed) + awaiting approval** — per-image proposals for all 115 from a multimodal pass                        | manifest `phase10Proposal`, workbench                                                                     |
| P1-8 | Synthetic disclosure ~9.92px; missing on home hero | **resolved** — ≥13px, ≥4.5:1 worst-case; scoped home-hero disclosure added                                                  | `docs/DISCLOSURE-AUDIT.md`                                                                                |
| P1-9 | Visible data defects                               | **resolved** — taxonomy, duplicate nouns, canonical consolidation, display rounding; `lint:content` clean; regression tests | `src/lib/ingredients.ts`, `src/lib/planner.ts`, `data/ingredient-canonical.json`, `tests/phase10.test.ts` |

Legend: **resolved** = agent-fixable and done; **tooled-awaiting-operator** = tooling built, human-gated action remains (see `docs/OPERATOR-ACTIONS.md`).

## Deliverable index

| Area                                | Path                                                                                                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Governance + incident               | `docs/GOVERNANCE.md`                                                                                                                                                                                                       |
| Discovery                           | `docs/PHASE-10-DISCOVERY.md`                                                                                                                                                                                               |
| Origin diagnosis (read-only)        | `docs/ops/ORIGIN-DIAGNOSIS-2026-07.md`                                                                                                                                                                                     |
| Data integrity code                 | `src/lib/ingredients.ts`, `src/lib/planner.ts`, `src/components/RecipePage.astro`, `src/components/RecipeCard.astro`, `src/pages/menus/[guests].astro`, `src/pages/tools/index.astro`, `src/components/PlannerTools.astro` |
| Canonical ingredients               | `data/ingredient-canonical.json`                                                                                                                                                                                           |
| Content lint                        | `scripts/lint-content.mjs`, `npm run lint:content`                                                                                                                                                                         |
| Regression tests                    | `tests/phase10.test.ts`                                                                                                                                                                                                    |
| Alt proposals + interim corrections | `data/media-manifest.json` (`phase10Proposal`, `phase10AltPass`)                                                                                                                                                           |
| Disclosure fixes + audit            | `src/styles/global.css`, `src/pages/index.astro`, `docs/DISCLOSURE-AUDIT.md`, `scripts/qa/disclosure-audit.mjs`                                                                                                            |
| Structural + axe suite              | `scripts/qa/structural-axe.mjs`, `qa/phase-10/structural-report.json`                                                                                                                                                      |
| Safety media briefs                 | `docs/media-briefs/phase-10/`                                                                                                                                                                                              |
| Media ingest                        | `scripts/media-ingest.mjs`, `npm run media:ingest`, `src/lib/media.ts` (supersede chain)                                                                                                                                   |
| QA matrix                           | `scripts/qa/screenshots.mjs`, `qa/phase-10/qa-manifest.json`                                                                                                                                                               |
| Review workbench                    | `review/index.html`, `review/app.js`, `scripts/build-review-data.mjs`, `scripts/review-apply.mjs`                                                                                                                          |
| Readiness gate                      | `scripts/release-check.mjs`, `npm run release:check`                                                                                                                                                                       |
| CI                                  | `.github/workflows/release-readiness.yml`                                                                                                                                                                                  |
| Operator punch list                 | `docs/OPERATOR-ACTIONS.md`                                                                                                                                                                                                 |

## Deviations from the directive (with rationale)

1. **Working branch.** The directive named `phase-10/release-hardening`; this session was
   provisioned with `claude/document-instructions-25h9z9` and a binding rule against pushing
   elsewhere. The operator confirmed using the session branch. All other §1 rules honored.
2. **`phaseStatus` / `nextCommand` in `project-state.json` kept gate-compatible.** The Phase 5–8
   gate tests assert `phaseStatus === "complete"` and specific `nextCommand` phrasing. Rather than
   weaken historical gates, `currentPhase` is `10`, `phaseStatus` stays `"complete"` (the Phase 9
   baseline genuinely is), and Phase 10 progress lives in `phase10.status`. Documented inline via
   `phaseStatusNote`.
3. **QA screenshot binaries are `.gitignore`d, not committed.** The SHA-stamped `qa-manifest.json`,
   `structural-report.json`, and the generator are committed; the 90 PNGs (≈41 MB viewport /
   ≈141 MB full-page) are regenerated at HEAD on demand and in CI. This is a stronger, non-stale
   answer to P1-4 than baking soon-obsolete binaries into git history. See `docs/PHASE-10-BROWSER-QA.md`.
4. **`humanEditorialReview` added as a new top-level lane object** alongside the legacy
   `qa.humanEditorialReview: "required"` string (which a Phase 9 test asserts), rather than
   replacing it. Both coexist; the workbench/`review:apply` operate on the object.
5. **`release:check` built now (not deferred to §12).** §9.6 wires it into CI, so the gate script
   exists at the §11 checkpoint. It only ever reports pass/fail and reports authorization as
   pending; the §12 closing _run_ is not performed and awaits operator instruction.
6. **Node version.** The pinned toolchain is Node 24; this sandbox ran Node 22. Build/tests/QA all
   pass here, and CI/`.node-version` pin Node 24. Flagged in `docs/PHASE-10-DISCOVERY.md`.

## Things the 2026-07-17 review appears to have missed (flagged loudly)

1. **Overclaiming alt text is sitewide, not just G02/G03.** A multimodal pass that viewed every
   image found **18** overclaiming alts — **all 12 guide heroes (G01–G12)** plus HOME-gathering,
   CAT_FRESH, SYS_START, SYS_CLASS, SYS_GUIDES, and M19 — asserting people, objects, actions,
   "electric"/"approved"/"covered"/temperature claims not visible in frame. All 18 were corrected
   live immediately (interim, pending approval).
2. **A second taxonomy leak the review didn't itemize:** the menu pages rendered the **raw
   category slug** (`grilled-meat`) directly (`{recipe.category}`), not only the `DRAFT M05 · NONE`
   card case. Fixed to the category label.
3. **A pre-existing sitewide WCAG AA color-contrast failure.** The eyebrow accent `#c84a35` on the
   tinted cream background measured **4.09:1** (needs 4.5:1) — flagged on **104 of 116 pages** by
   axe. Not in the review. Fixed to `#b83c2b` (4.94:1).
4. **`0 g` rounding trap.** Naive "nearest 5" rounding turned tiny spice amounts (0.44 g cinnamon)
   into a misleading `0 g`; the display rounder now floors sub-5 g to 0.5 g.
5. **M19 duck doneness vs recipe endpoint conflict:** the recipe states a poultry-safe 74 °C
   endpoint while the image shows a rosy-pink interior. Surfaced for operator reconciliation in the
   duck brief; agents do not silently change a safety endpoint.

## Verification at this HEAD

- `npm run check` green (format, lint, typecheck, 146 tests, build, `lint:content` clean).
- Structural + axe sitewide: **116/116 pass, 0 serious/critical**.
- Disclosure audit: **23 synthetic elements, 0 failing** (headless computed sizes/contrast).
- `npm run release:check`: agent-fixable gates PASS; operator-gated gates (lane approvals, origin)
  correctly report **NOT READY**; authorization **PENDING**.

**STOP.** Awaiting the operator to complete `docs/OPERATOR-ACTIONS.md` steps 1–4 and say
**"Run Phase 10.7."**
