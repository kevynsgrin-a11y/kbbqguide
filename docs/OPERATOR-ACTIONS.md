# Phase 10 — Operator Actions

_The 2026-07-18 follow-up pass implemented the recommended agent-side fixes on draft PR #3. It
did not merge, deploy production, alter custom domains/DNS, flip robots, or record human review
decisions. Every page remains `noindex,nofollow,noarchive`._

**Merge authority and release authorization remain operator-only.** See `docs/GOVERNANCE.md`.

## Completed in the follow-up pass

- Replaced the four flagged images with new immutable candidates:
  `HOME-gathering-hero-r1`, `G02-hero-r1`, `G03-hero-r1`, and `M19-hero-r1`.
- Restaged the home hero with separate raw/cooked handling tools, corrected the G02/G03 brief
  mapping, made the outdoor-charcoal setting visibly open-air, showed the tabletop grill directly
  beneath a hood with one continuous visible cord, and replaced the rosy duck with an opaque,
  cooked-through presentation. The 74 °C / 165 °F recipe endpoint was not weakened.
- Added visibility-honest alt/caption/provenance records and a matching home social image.
- Kept the manifest immutable: the four former records are `replaced`; the four new records start
  with blank, required human-review lanes. Approval never transfers from a superseded asset.
- Hardened media ingest, active-asset filtering, preview validation, regression coverage, and the
  release gate. CI now regenerates and uploads structural/axe, disclosure, and 90 responsive
  screenshots at the exact checked-out SHA.
- Removed the redundant AVIF rendition tier after the Pages preview exceeded Cloudflare's
  20-minute build limit. Five responsive WebP widths and JPEG fallback remain; the cold local
  build now emits 1,265 optimized files while preserving crop, loading, and transfer budgets.
- Fixed narrow-screen disclosure overlap and kept guide/recipe safety subjects visible by placing
  mobile hero credits in a separate band below the image.

## 1. Resolve the production origin (P0-2)

The Pages preview is separate from the production apex. The latest read-only check still found
`kbbqguide.com` and `www.kbbqguide.com` returning 502. Follow
`docs/ops/ORIGIN-DIAGNOSIS-2026-07.md`:

1. Collect the documented `dig` / `curl` evidence.
2. In Cloudflare, attach the apex and `www` as Custom Domains on the `kbbqguide` Pages project (or
   apply the alternate diagnosis supported by the evidence) and wait for **Active**.
3. Re-test apex, `www`, and the immutable Pages preview.
4. Only after success, record `production.originStatus: "resolved"` and the date in
   `project-state.json`.

This does not authorize production deployment or indexing.

## 2. Complete asset-level human review (P1-3, P1-7)

There is no `review/decisions.json` yet, so the release gate correctly reports **0/115 active
assets fully approved or waived**. The user's instruction to implement all recommendations chose
the recommended replacement direction; it is not a fabricated five-lane review of every asset.

1. Open `review/index.html` and enter reviewer name/date.
2. Review all 115 active assets for food identity, safety, cultural/language accuracy,
   accessibility, and brand/crop quality. Accept or edit the proposed alt text.
3. Use a qualified heritage-language reviewer for the cultural lane, or record an explicit
   operator waiver with rationale.
4. Pay special attention to the four new replacement IDs above; they intentionally re-entered the
   queue with blank lanes.
5. Export the result to `review/decisions.json`.

## 3. Complete manual browser/device/AT checks (P1-4)

CI covers all 116 routes structurally, runs axe, audits disclosures, checks overflow, and captures
18 representative routes at 320, 390, 768, 1440, and 1920 pixels. The following still require a
person and must not be inferred from automation:

- true 200% and 400% text zoom;
- physical-device keyboard/touch focus and menu behavior;
- VoiceOver or NVDA reading order, landmarks, controls, and image alternatives;
- final overlay contrast and responsive-crop judgment on the live preview.

Record results in `docs/PHASE-10-BROWSER-QA.md`.

## 4. Closing readiness run

When origin, the exported review decisions, and manual checks are complete, tell the agent exactly:
**"Run Phase 10.7."** The closing run will apply `review/decisions.json`, regenerate exact-SHA
browser evidence, and execute `npm run release:check`.

That gate reports readiness only. It never merges, deploys, changes DNS/custom domains, or
authorizes indexing. Production deployment and the separately recorded robots/indexing change
remain operator actions.

## Current checkpoint

| Area                                | State                                                   |
| ----------------------------------- | ------------------------------------------------------- |
| Build, data integrity, content lint | ✅ local full gate passed on 2026-07-18                 |
| Four flagged image remediations     | ✅ implemented as new immutable candidates              |
| Responsive/structural evidence      | 🔄 exact-SHA PR CI reruns after every runtime change    |
| Human media decisions               | 🔶 0/115; `review/decisions.json` still required        |
| Manual device / screen-reader QA    | 🔶 operator required                                    |
| Production origin                   | 🔶 operator Cloudflare action; apex and `www` still 502 |
| Merge / production deploy / robots  | ⛔ not performed and not authorized                     |
