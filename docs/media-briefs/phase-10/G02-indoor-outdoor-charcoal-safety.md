# Brief — G02 indoor/outdoor charcoal safety hero

- **Slot (supersedes):** `G02-hero` · **Guide:** Indoor vs. Outdoor Korean BBQ Safety
- **New id on ingest:** `G02-hero-r1` (auto) · **Master:** 2400×1600 JPEG, 3:2

## Purpose

The current frame combines an indoor electric grill and an outdoor charcoal grill near an open
door, but it does not make the charcoal grill's structural clearance unambiguous. The guide is
specifically about charcoal used indoors versus outdoors and generous clearances. The new image
must depict an **unambiguously open-air charcoal setup with visibly generous clearance** —
nothing implied off-frame.

## Implementation status

Implemented on 2026-07-18 as immutable candidate `G02-hero-r1`: a kettle charcoal grill on a wide
stone-paver pad in an open lawn, with the nearest house held far in the background. The asset
remains `humanEditorialReview: required`; this implementation record does not certify any lane.

## Must show (checklist)

- [ ] A charcoal grill **clearly outdoors / open-air** (open sky, patio, or yard visibly around it).
- [ ] **Visibly generous clearance** between the charcoal grill and any structure, wall, railing,
      eave, or opening — measurable at a glance, not marginal.
- [ ] A stable, level, non-combustible base under the grill.
- [ ] If any cord/tool is in frame, it is fully visible and sensibly placed (no off-frame trailing).

## Must avoid

- [ ] Any doorway-adjacent or under-eave/overhang ambiguity (the exact failure being corrected).
- [ ] Charcoal indoors, or an interior that could read as indoors.
- [ ] Implied certification/approval marks or claims the frame can't support.
- [ ] A range hood or interior ventilation (that's the G03 tabletop-grill story, not this one).
- [ ] Cramped clearance that undercuts the "generous clearance" message.

## Composition & style tokens

Campaign palette: warm cream / charcoal / brick-red / restrained-gold; editorial three-quarter
warmth; natural daylight; rounded frame. Focal point ~54% / 50% with a `center-safe` mobile crop
(keep the grill and its clearance in the central zone so the mobile crop preserves them).

## Aspect ratios & responsive crop

- Master **2400×1600 (3:2)**; derivatives at **360/640/960/1280/1600** in **avif/webp/jpeg**.
- The clearance gap must remain readable at 390px — keep the grill-to-structure gap within the
  `center-safe` zone.

## Target filename + manifest slot

- File: `src/assets/media/guides/g02-master-<newId>.jpg` (installed by `media:ingest`).
- Slot id stays `G02-hero`; new immutable id `G02-hero-r1`; old marked `replaced`.

## Acceptance checklist (operator ticks before slotting in)

- [ ] Unambiguously open-air; no indoor/doorway ambiguity.
- [ ] Generous grill-to-structure clearance visible at a glance.
- [ ] No implied approval/airflow/cord-safety claims the frame can't support.
- [ ] Palette/warmth/rounded-frame consistent with the campaign.
- [ ] Clearance readable at 390 / 768 / desktop and the center-safe mobile crop.
- [ ] A visibility-honest alt can be written without asserting anything not shown.
