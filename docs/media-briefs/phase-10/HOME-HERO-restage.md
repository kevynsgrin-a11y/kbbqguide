# Brief — HOME hero restage (raw/cooked/tool separation)

- **Slot (supersedes):** `HOME-gathering-hero` · **Page:** Home hero (`/`)
- **New id on ingest:** `HOME-gathering-hero-r1` (auto) · **Master:** 2400×1600 JPEG, 3:2

## Purpose (P1-6)

The home hero must model the site's core safety message — **raw and cooked kept separate, with
dedicated raw-handling tools** — because it is the first image visitors see. The current frame
reads warmly but does not make the raw/cooked/tool separation legible, and its previous alt implied
an "electric" grill whose power source is not visible. Restage so the separation is unmistakable
while preserving the social warmth and crop behavior that already work.

## Must show (checklist)

- [ ] **Dedicated raw-handling tongs/utensils visibly distinct** (e.g. by color/placement) from the
      clean serving utensils, and clearly associated with the raw-meat zone.
- [ ] **Raw marbled meat on its own board/zone**, spatially separated from ready-to-eat banchan and
      any cooked food.
- [ ] Cooked/ready-to-eat food and banchan in a clearly separate area of the table.
- [ ] The social warmth and principal person(s) that make the current image work.

## Must avoid

- [ ] Raw meat touching or adjacent to ready-to-eat food or shared serving tools.
- [ ] A single ambiguous set of tongs used for both raw and cooked.
- [ ] Alt-worthy claims about the grill's power source unless a cord/controls are actually visible.
- [ ] Losing the warmth/composition — this is a restage, not a sterile diagram.

## Composition & style tokens

Campaign palette: warm cream / charcoal / brick-red / restrained-gold; editorial three-quarter
warmth; rounded frame. **Preserve the crop behavior that currently works at 390 / 768 / desktop**
and the `people-right` mobile crop with focal point ~58% / 50% (the hero has a left-side text scrim,
so keep the key subjects and the raw/cooked separation out of the far-left third).

## Aspect ratios & responsive crop

- Master **2400×1600 (3:2)**; derivatives at **360/640/960/1280/1600** in **avif/webp/jpeg**.
- The raw zone + dedicated tongs must survive the `people-right` mobile crop — keep them in the
  right-central region, clear of the left text scrim.

## Target filename + manifest slot

- File: `src/assets/media/brand/home-gathering-master-<newId>.jpg` (installed by `media:ingest`).
- Slot id stays `HOME-gathering-hero`; new immutable id `HOME-gathering-hero-r1`; old `replaced`.

## Operator decision — Option A selected

On 2026-07-18 the operator instructed the agent to move forward with all recommendations. The
recommended **Option A — Restage** was implemented and ingested as `HOME-gathering-hero-r1`.
The candidate visibly separates a red raw-meat tray and red-handled raw tongs from browned food
handled with stainless tongs. It remains `humanEditorialReview: required`; this implementation
record does not certify any review lane.

## Acceptance checklist (operator ticks before slotting in)

- [ ] Dedicated raw tongs visibly distinct and tied to the raw zone.
- [ ] Raw meat on its own board/zone, separated from ready-to-eat food.
- [ ] Warmth, principal person(s), and left-scrim-safe composition preserved.
- [ ] Reads at 390 / 768 / desktop and survives the people-right mobile crop.
- [ ] A visibility-honest alt can be written without asserting an unseen power source.
