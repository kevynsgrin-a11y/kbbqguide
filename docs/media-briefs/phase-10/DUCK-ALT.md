# Brief — Duck breast hero (duck-not-pork + cooked-through endpoint)

- **Slot (supersedes):** `M19-hero` · **Recipe:** Korean-Style Grilled Duck Breast
- **Replacement id:** `M19-hero-r1` · **Master:** 2400×1600 JPEG, 3:2

## Operator disposition — Option A selected

On 2026-07-18 the operator instructed the agent to move forward with all recommendations. The
recommended **Option A** was implemented: a new immutable candidate was generated and ingested as
`M19-hero-r1`. Its opaque tan-brown interior follows the recipe's stated 165 °F / 74 °C endpoint.
The endpoint was not weakened or changed. The new asset remains `humanEditorialReview: required`.

The previous "rosy-pink interior" description was also corrected. Review of the original master
did not reliably support that color claim, so it was not used as a basis for a recipe safety
change. The active candidate's proposed alt describes only its cooked-through visible interior.

## Doneness reconciliation — resolved in favor of the recipe

The recipe remains at **165 °F / 74 °C (fully cooked)**. The replacement image follows that
endpoint with no pink or translucent center. A human food/safety reviewer must still confirm the
new image's duck identity and safety framing in the workbench; generation does not certify it.

## Must show (checklist used for the Option A regeneration)

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

- Master **2400×1600 (3:2)**; derivatives at **360/640/960/1280/1600** in **webp/jpeg**.
- Keep the scored fat cap + silhouette within the center-safe zone for the mobile crop.

## Target filename + manifest slot

- File: `src/assets/media/recipes/m19/hero-master-M19-hero-r1.jpg`.
- Slot id stays `M19-hero`; new immutable id `M19-hero-r1`; old entry is `replaced`.

## Acceptance checklist (human food/safety reviewer still records in the workbench)

- [ ] Reads unmistakably as duck (scored fat cap, elongated silhouette, deeper tone).
- [ ] Doneness matches the recipe's final endpoint.
- [ ] Palette/warmth/rounded-frame consistent with the campaign.
- [ ] Reads at 390 / 768 / desktop and the center-safe mobile crop.
- [ ] Recipe endpoint text and image doneness are reconciled and consistent.
