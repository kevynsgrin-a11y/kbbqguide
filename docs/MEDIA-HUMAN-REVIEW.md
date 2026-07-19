# Phase 9 Human Media Review

Status: **required before public release**  
Scope: 115 active `synthetic-labeled` editorial assets
Machine inventory: `data/media-manifest.json`  
Flat inventory: `docs/media-assets-phase9.csv`

## What has been completed

The Phase 9 implementation screened every promoted master at full composition for subject identity, obvious ingredient conflicts, unsafe doneness or raw/cooked-contact depiction, bivalve shell cues, guest-count accuracy, crop safety, anatomy, artifacts, logos, text, and watermarks. Rejected first passes were replaced rather than promoted: M19 for a rosy duck interior, SF01 for raw shrimp behind a cooked serving, the guides-index frame for raw meat in a planning workspace, the eight-guest menu for showing only six settings, the menu-scaling guide for baked-in calculator numerals, and the media-kit/licensing frames for small device or calibration markings. The promoted set has no implementation-screen failures.

This is an implementation QA pass, not a human editorial approval. No human sign-off is inferred in the manifest.

## Required human review lanes

| Lane                              | Scope                                                    | Required decision                                                            |
| --------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Food editor / test kitchen        | 80 recipe heroes                                         | Dish identity, ingredient plausibility, yield, texture, and serving state    |
| Food-safety reviewer              | All recipes; prioritize meats and seafood                | Doneness, raw/cooked separation, appliance context, shells, and holding cues |
| Korean cultural/language reviewer | All recipe, gathering, category, guide, and menu imagery | Names, context, table setting, adaptation framing, and stereotype avoidance  |
| Accessibility editor              | All 115 assets                                           | Alt decision, final alt text, caption usefulness, and credit clarity         |
| Brand/editorial lead              | All 115 assets                                           | Tone, crop, cohesion, repetition, and release suitability                    |

## Review protocol

1. Review the 2400 × 1600 master and rendered 16:9, 4:3, and mobile crops.
2. Record `pass`, `revise`, or `replace` against the immutable asset ID.
3. Add reviewer name, date, and concise evidence to the manifest QA object.
4. A `revise` or `replace` decision blocks public release for that surface but does not require removing the honest no-index preview.
5. Never change `synthetic-labeled` to `original-approved`; a replacement photographed asset needs its own provenance and status.

---

## Phase 10.6 update — the review workbench (2026-07-18)

Phase 10 operationalizes the protocol above with a local, keyboard-operable sign-off
tool so the five lanes can be completed in one sitting, and an apply step that writes
the operator's decisions back into the manifest. **Agents propose; only the operator
approves — nothing below is ever run by an agent with real decisions.** (This section is
appended, not a replacement: the lanes and protocol above still govern.)

### Per-asset schema (added in Phase 10.6)

Every active asset now carries a top-level `humanEditorialReview` object alongside the
legacy `qa.humanEditorialReview` flag:

```json
"humanEditorialReview": {
  "status": "required | approved | rejected | replaced",
  "lanes": {
    "food":          { "decision": "", "reviewer": "", "date": "", "notes": "" },
    "safety":        { "decision": "", "reviewer": "", "date": "", "notes": "" },
    "cultural":      { "decision": "", "reviewer": "", "date": "", "notes": "" },
    "accessibility": { "decision": "", "reviewer": "", "date": "", "notes": "" },
    "brand":         { "decision": "", "reviewer": "", "date": "", "notes": "" }
  }
}
```

Lane `decision` is one of `approve | reject | replace | defer | ""` (empty = undecided).
Each asset also carries a machine-attributed `phase10Proposal` (proposed alt text and
informative/decorative role from a multimodal pass that viewed every image), which the
workbench pre-loads for the operator to accept or edit.

### Workbench

`review/index.html` — plain HTML+JS, opens over `file://` or any local server, excluded
from the site build (`dist/`) and marked `noindex`. Per asset it shows the image, id, where
it is used, the current live alt, an **editable textarea prefilled with the proposed alt**,
the proposed informative/decorative role, and the five lane controls plus per-lane notes.
It offers **bulk-apply per lane** (stamp one lane across all shown assets with a reviewer
name + date — e.g. after an outsourced cultural pass) and an **Export decisions** button
that writes `review/decisions.json`.

Regenerate its data after any manifest change: `npm run review:data`.

### Applying decisions

```bash
npm run review:apply -- review/decisions.json          # all lanes must be decided
npm run review:apply -- review/decisions.json --partial # apply a partial pass
```

`review:apply` records every lane into the manifest, rolls `status` up from the lane
decisions (`reject`→rejected, `replace`→replaced, all `approve`→approved, else required),
and applies **approved** alt text (accessibility lane = approve) to the live manifest
`altText`/`altDecision` (decorative ⇒ empty alt). It **refuses** to run if any active asset
has an undecided lane unless `--partial` is passed.

### Interim alt corrections (Phase 10.3)

18 assets whose original alt text overclaimed (asserted something not visible — e.g. the
G02/G03 safety heroes) had their live alt corrected to visibility-honest text immediately,
per the directive's "false safety claims must not survive" exception. These remain
`proposals subject to operator approval`; see each asset's `phase10Proposal.previousAltText`.

### Cultural/language lane

The cultural lane is built so a hired heritage-speaker reviewer can complete all 115 assets
in one sitting (bulk-apply after the pass). The operator either commissions that pass or
records an explicit waiver — an honest recorded decision either way, never silence.
