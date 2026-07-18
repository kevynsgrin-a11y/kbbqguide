# Brief — Duck breast hero (duck-not-pork + doneness) — OPERATOR'S CALL

- **Slot (supersedes):** `M19-hero` · **Recipe:** Korean-Style Grilled Duck Breast
- **New id on ingest:** `M19-hero-r1` (auto) · **Master:** 2400×1600 JPEG, 3:2

## Header — two options (operator, as food editor, chooses)

- **Option A — Regenerate** to the brief below so the subject unmistakably reads as duck and the
  doneness matches the recipe's stated endpoint.
- **Option B — Approve the current frame with a note.** The multimodal pass observed a seared,
  crosshatch-scored, rosy-pink sliced breast that reads plausibly as duck; if you (as food editor)
  judge it correct, record an explicit approval note reconciling the visible rosy interior with the
  recipe text (see "Doneness reconciliation" below). No regeneration required.

The interim honesty-corrected alt already describes only what is visible ("seared crosshatched
crust and rosy-pink interior") and ships regardless of this decision.

## Doneness reconciliation (must be resolved either way)

The recipe page currently states a poultry-safe endpoint of **165 °F / 74 °C (fully cooked)**, but
the image shows a **rosy-pink interior** (typical of duck breast cooked to medium). These conflict.
Resolve one of two ways:

- **Recipe follows image:** if duck breast is intended medium (rosy), update the recipe's endpoint
  language accordingly (duck breast is commonly served medium; this is a recipe-copy decision), or
- **Image follows recipe:** regenerate (Option A) to show a **cooked-through** interior consistent
  with 74 °C.

This is flagged for the operator; agents do not silently change the safety endpoint.

## Must show (checklist — for Option A regeneration)

- [ ] **Duck-specific cues:** crosshatch-scored fat cap, elongated breast silhouette, deeper
      duck-meat tone — so it cannot read as pork.
- [ ] Doneness **consistent with the recipe's final endpoint** (cooked-through per 74 °C if the
      recipe keeps that endpoint).
- [ ] Clean plating consistent with the finished-dish-hero role.

## Must avoid

- [ ] Pale, uniformly pink slices that read as pork loin/belly.
- [ ] A doneness that contradicts the recipe's stated safe endpoint.
- [ ] Garnish/props that obscure the scored fat cap or breast silhouette.

## Composition & style tokens

Campaign palette: warm cream / charcoal / brick-red / restrained-gold; editorial three-quarter
warmth; rounded frame. Focal point 50% / 50%, `center-safe` mobile crop.

## Aspect ratios & responsive crop

- Master **2400×1600 (3:2)**; derivatives at **360/640/960/1280/1600** in **avif/webp/jpeg**.
- Keep the scored fat cap + silhouette within the center-safe zone for the mobile crop.

## Target filename + manifest slot

- File: `src/assets/media/recipes/m19/hero-master-<newId>.jpg` (installed by `media:ingest`).
- Slot id stays `M19-hero`; new immutable id `M19-hero-r1`; old `replaced` (only if Option A).

## Acceptance checklist (operator ticks before slotting in — Option A)

- [ ] Reads unmistakably as duck (scored fat cap, elongated silhouette, deeper tone).
- [ ] Doneness matches the recipe's final endpoint.
- [ ] Palette/warmth/rounded-frame consistent with the campaign.
- [ ] Reads at 390 / 768 / desktop and the center-safe mobile crop.
- [ ] Recipe endpoint text and image doneness are reconciled and consistent.
