# Phase 10 — Operator Actions

_Phase 10.0–10.6 are complete on branch `claude/document-instructions-25h9z9` (DRAFT PR #3).
The agent has STOPPED here per directive §11. Nothing is released; every page keeps
`noindex,nofollow,noarchive`. Work through the steps below in order. Do not proceed to Phase 10.7
until steps 1–4 are done and you tell the agent **"Run Phase 10.7."**_

**Merge authority and release authorization are yours alone.** No agent merges the PR, changes
production, or flips robots. See `docs/GOVERNANCE.md`.

---

## 1. Origin decision (P0-2) — fix the apex 502

The agent could not reach the network from its sandbox (proxy denies external hosts; `dig` absent),
so the live DNS/HTTP evidence must be collected by you. Read
`docs/ops/ORIGIN-DIAGNOSIS-2026-07.md` in full, then:

1. Run the evidence block in that doc (`dig` / `curl` for apex, `www`, and `*.pages.dev`).
2. Execute the chosen remediation in the Cloudflare dashboard. The ranked most-likely fix is
   **H1 — attach `kbbqguide.com` (and `www`) as a Custom Domain on the `kbbqguide` Pages project**
   and wait for status **Active**; that also resolves the stale-record and proxied-origin cases.
3. Re-test with the verification block in the doc.
4. When the apex serves, set `production.originStatus: "resolved"` (with the date) in
   `project-state.json` — or tell the agent to.

This does **not** authorize indexing; `noindex` stays until step 5's separate authorization.

## 2. Review session (P1-3, P1-7) — approve media in the workbench

1. Open `review/index.html` in a browser (double-click / `file://`, or serve the repo locally). It
   loads all **115 assets** with the agent's proposed alt text pre-filled and five review lanes.
2. Enter your name + date (top bar). For each asset: accept or edit the alt text, set
   informative/decorative, and tick the lanes you certify — **food, safety, accessibility, brand**
   (visual identity, doneness/safety framing, alt/caption, tone/crop).
3. **Cultural / language lane:** either (a) bulk-defer and commission a heritage-speaker editorial
   pass — the workbench is built so a hired reviewer can complete all 115 in one sitting and
   bulk-apply — or (b) record an explicit operator **waiver** with rationale. An honest recorded
   decision either way, never silence.
4. The **18 overclaim-corrected** assets are pre-flagged (their live alt was already corrected to
   visibility-honest text; the original is in each asset's `phase10Proposal.previousAltText`).
   Confirm the corrected alt or edit it.
5. Click **Export decisions.json** (saves `review/decisions.json`).

## 3. Image regeneration (P1-5, P1-6, duck) — feed the briefs

1. Feed the four briefs in `docs/media-briefs/phase-10/` to your image pipeline:
   - `G02-tabletop-grill-ventilation.md`, `G03-indoor-outdoor-charcoal-safety.md`,
     `HOME-HERO-restage.md`, `DUCK-ALT.md`.
2. Tick each brief's acceptance checklist before slotting in; regenerate if any item fails.
3. Ingest each result: `npm run media:ingest -- <file> --supersedes <oldId>` (use `--dry-run`
   first). It validates, installs the master with a new immutable id, and marks the old replaced.
4. **Decide the two framed questions:**
   - **Home hero** — restage (Option A) or approve-current-with-note (Option B). The scoped
     synthetic disclosure and honesty-corrected alt ship either way.
   - **Duck breast** — regenerate (Option A) or approve-with-note (Option B), and **reconcile the
     doneness**: the recipe states a poultry-safe 74 °C endpoint but the image shows a rosy-pink
     interior. Either update the recipe endpoint copy or regenerate to cooked-through. The agent
     will not silently change a safety endpoint.
5. Any ingested replacement re-enters the workbench (step 2) for its own five-lane sign-off.

## 4. Manual QA gates (P1-4) — real browser / device / AT

Complete the operator-manual checklist in `docs/PHASE-10-BROWSER-QA.md`: true 200% and 400% text
zoom, physical-device focus and menu behavior, a screen-reader pass, and final contrast of the
credit/disclosure over the live hero image at each width. These are **not** simulated by the
headless suite; tick them there as you verify.

## 5. When 1–4 are done

Tell the agent: **"Run Phase 10.7."** The closing run will ingest `review/decisions.json`
(`review:apply`), verify any replacement assets, re-run the QA + structural matrix at the new
HEAD, and run `npm run release:check` — which reports pass/fail per gate and reports authorization
as **pending**. It never merges and never authorizes.

Only **you** then merge the PR and run the single, separately-recorded authorization step
(recording `release.authorizedBy` + date in `project-state.json` and flipping robots in that same
operator-driven commit). No agent is ever authorized to do either.

---

### Quick status at this checkpoint (HEAD `07cc0ea`)

| Item                              | State                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- |
| Data/editorial defects (P1-9)     | ✅ fixed; `lint:content` clean; regression tests added                     |
| Alt text (P1-7)                   | ✅ proposals for 115; 18 overclaims corrected live; awaiting your approval |
| Disclosure (P1-8)                 | ✅ ≥13px, ≥4.5:1, home-hero disclosure added; audit committed              |
| Accessibility (7C)                | ✅ structural + axe green sitewide (116/116, 0 serious/critical)           |
| Governance (P0-1)                 | ✅ recorded + hardened                                                     |
| Origin 502 (P0-2)                 | 🔶 diagnosed read-only; **your** Cloudflare fix (step 1)                   |
| Media approvals (P1-3)            | 🔶 workbench built; **your** review session (step 2)                       |
| Safety/home/duck imagery (P1-5/6) | 🔶 briefs + ingest ready; **your** regeneration (step 3)                   |
| Manual QA (P1-4)                  | 🔶 headless matrix done; **your** manual gates (step 4)                    |
