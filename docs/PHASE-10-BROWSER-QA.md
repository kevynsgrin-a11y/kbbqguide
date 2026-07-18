# Phase 10 — Browser QA (supersedes the Phase 9 record)

_Addresses P1-4 (stale browser-QA evidence). All evidence here is captured against the local
build of the current HEAD; the SHA is recorded into every artifact so it can never silently go
stale again. This record supersedes `docs/PHASE-9-BROWSER-QA.md`._

## HEAD and build

- **Evidence HEAD:** `88919d2` (recorded in `qa/phase-10/qa-manifest.json` and
  `qa/phase-10/structural-report.json`). The matrix regenerates at any HEAD with:
  ```bash
  npm run build
  node scripts/qa/structural-axe.mjs --sha=$(git rev-parse HEAD)
  node scripts/qa/disclosure-audit.mjs --sha=$(git rev-parse HEAD)
  node scripts/qa/screenshots.mjs     --sha=$(git rev-parse HEAD)   # add --full for full-page
  ```
- **Build command:** `npm run build` (phase gate + validators + `lint:content`), output `dist/`.
- **Note:** committing these artifacts advances HEAD by one evidence-only commit. The
  `release:check` SHA gate is re-established at the Phase 10.7 closing run, when the operator
  re-runs the matrix as the final step (directive §12.3). The source tree the evidence reflects
  is unchanged by an artifacts-only commit.

## Screenshot matrix

- **18 representative routes × 5 widths = 90 captures**, written to
  `qa/phase-10/screenshots/` as `{route-slug}--{width}w--{sha7}.png` and indexed by the committed
  `qa/phase-10/qa-manifest.json` (`{sha,timestamp,route,width,path,fullPage,buildCommand}` per
  capture).
- **Widths:** 320 (WCAG 1.4.10 reflow proxy), 390, 768, 1440, 1920.
- **Routes:** home; recipe index; all six category pages; bulgogi, gochujang grilled shrimp,
  grilled duck breast, gyeran mari; guide index; tabletop-grill/ventilation guide;
  indoor/outdoor safety guide; menu index; four-guest and eight-guest menus.
- **What is committed vs regenerated (deviation — flagged in `docs/PHASE-10-STATUS.md`):** the
  SHA-stamped `qa-manifest.json`, `structural-report.json`, and the generator script are
  committed; the **PNG binaries are `.gitignore`d** (≈41 MB viewport / ≈141 MB full-page) rather
  than baked into git history, because they are large and are regenerated at the Phase 10.7 final
  HEAD anyway. This is a stronger, non-stale answer to P1-4 than committing soon-obsolete
  binaries: the exact matrix is reproducible on demand and in CI with
  `node scripts/qa/screenshots.mjs --sha=$(git rev-parse HEAD)` (add `--full` for full-page), and
  the manifest records precisely what was captured at which SHA.

## Structural + axe results (sitewide, all 116 routes)

From `qa/phase-10/structural-report.json` — **116/116 pass, 0 failures**:

- Exactly one `<h1>` and one `<main>` per page; `html[lang]` set.
- Zero images missing an `alt` attribute; no unnamed controls; no empty links.
- No horizontal overflow at 390 or 768.
- **axe-core: zero serious/critical violations** (the pre-existing sitewide eyebrow
  color-contrast AA failure, `#c84a35`→`#b83c2b`, was fixed in Phase 10.3).

## Disclosure audit

From `docs/DISCLOSURE-AUDIT.md` — **23 synthetic-disclosure elements measured headlessly, 0
failing**: every synthetic-content credit/disclosure is ≥ 13px with ≥ 4.5:1 worst-case contrast.

## Readiness gate snapshot (`npm run release:check`)

At `88919d2`: `lint:content` clean, QA matrix SHA + coverage PASS, disclosure audit PASS,
noindex present on 116/116 pages. The two remaining gates are **operator-gated and expected to
fail until the operator acts**: asset review lanes (0/115 approved — awaiting the Phase 10.6
workbench pass) and `production.originStatus` (`failing-502` — awaiting the operator's
Cloudflare fix). Release authorization is **PENDING** and is never performed by any gate.

## Manual gates OUTSTANDING (operator — not simulated, not claimed)

These require a real browser / device / assistive technology and are **not** covered by the
headless suite. Do not treat them as passed until ticked here.

| Gate                               | How to verify                                                                    | Per-route checklist                               |
| ---------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| True text zoom 200%                | Browser zoom to 200%, confirm no loss of content/function                        | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| True text zoom 400% / reflow       | Zoom to 400% (or 320px), confirm single-column reflow, no 2-D scroll             | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| Physical-device focus order        | Tab through each template on a real device; visible focus, logical order         | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| Menu / disclosure behavior         | Keyboard + touch open/close of nav and any disclosures                           | ☐ home ☐ recipe ☐ guide ☐ menu ☐ tools            |
| Screen-reader pass                 | VoiceOver/NVDA read of headings, alt, landmarks, controls                        | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| Final contrast over image overlays | Real device: credit/disclosure legibility over the live hero image at each width | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu         |

The headless disclosure audit already bounds contrast over any image (panel composited over
white and black); this manual gate confirms it on the live production image at real breakpoints.
