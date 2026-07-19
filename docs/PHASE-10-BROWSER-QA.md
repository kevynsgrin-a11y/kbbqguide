# Phase 10 — Browser QA

_The committed JSON reports are a historical baseline. The authoritative PR evidence is regenerated
at the exact GitHub checkout SHA and uploaded by `.github/workflows/release-readiness.yml`; the
manual release job regenerates it again before `release:check`._

## Automated exact-SHA evidence

The PR workflow builds under Node 24 with Chromium and produces one downloadable artifact named
`phase-10-qa-release-readiness-<sha>` containing:

- `qa/phase-10/structural-report.json` for all **116 routes**;
- `qa/phase-10/qa-manifest.json` plus **90 viewport screenshots**;
- `docs/DISCLOSURE-AUDIT.md` from computed browser styles.

The screenshot matrix covers 18 representative routes at **320, 390, 768, 1440, and 1920 px**:
home; recipe library; all six categories; bulgogi, shrimp, duck, and gyeran-mari details; guide
index; G02 and G03 guide details; menu index; and four- and eight-guest menus. The new home, G02,
G03, and duck replacements are therefore all included.

The structural suite requires, on every route:

- exactly one `<h1>` and one main landmark, with `html[lang]` present;
- an `alt` attribute on every image;
- no unnamed controls or empty links;
- no horizontal overflow at 390 or 768 px;
- zero serious or critical axe violations.

The disclosure audit requires each synthetic-content disclosure/credit to be at least 13 CSS px
and 4.5:1 in the tool's worst-case compositing check.

To reproduce locally when Chromium is available:

```bash
npm run build
node scripts/qa/structural-axe.mjs --sha=<exact-commit-sha>
node scripts/qa/disclosure-audit.mjs --sha=<exact-commit-sha>
node scripts/qa/screenshots.mjs --sha=<exact-commit-sha>
```

`release:check` rejects missing/mismatched reports, anything other than 90 screenshot captures and
116/116 structural passes, later runtime changes, or uncommitted runtime changes. Evidence followed
only by QA/documentation commits remains valid.

## Manual gates — outstanding until a person records them

Automation does not certify perception, physical-device interaction, cultural judgment, or
assistive-technology reading quality. Check each box only after performing the test on the latest
immutable Pages preview.

| Gate                         | How to verify                                                           | Per-template checklist                            |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| True text zoom 200%          | Browser zoom to 200%; no loss of content or function                    | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| True text zoom 400% / reflow | Browser zoom to 400%; single-axis reading and no clipped controls       | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| Physical-device focus order  | Keyboard through every template; visible focus and logical order        | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| Menu / disclosure behavior   | Keyboard and touch open/close behavior                                  | ☐ home ☐ recipe ☐ guide ☐ menu ☐ tools            |
| Screen-reader pass           | VoiceOver/NVDA headings, landmarks, alt text, and controls              | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu ☐ tools |
| Responsive crop / identity   | At all five widths, key food/safety details remain visible              | ☐ home ☐ G02 ☐ G03 ☐ duck                         |
| Overlay contrast             | Credit/disclosure remains legible over each live hero crop              | ☐ home ☐ recipe ☐ category ☐ guide ☐ menu         |
| Cultural accuracy            | Qualified reviewer checks food naming, visual cues, and language claims | ☐ replacement set ☐ representative library set    |

## Current readiness interpretation

A green PR browser-QA job proves automated structural, axe, disclosure, and responsive-capture
coverage for that SHA. It does **not** satisfy the 115 asset-level human decisions, the checklist
above, production-origin repair, merge approval, deployment authorization, or robots/indexing
authorization.
