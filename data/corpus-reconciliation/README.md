# Corpus structural reconciliation bridge

Generated 2026-10-04 by Recipe Finalz `scripts/export-kbbqguide-bridge.mjs`.
One payload per record (`<id>.json`) carrying the corpus masters' structural
content — ingredientGroups, instructions (corpus actions + checkpoint cues),
visualDonenessCues, storageNotes — shaped to the site schema.

## Adoption protocol (per record, inside the site's review pipeline)

These payloads are STAGING. The phase gates intentionally lock the live
fields: batch step counts, per-step safetyNotes, ingredient-id canonical
shopping mapping, and storage safety patterns. Merging is a three-review act:

1. **Test cook** — validate the corpus quantities/method against a real cook;
   adjust payload steps to observed reality.
2. **Food safety review** — author the per-step `safetyNote` (the corpus
   deliberately ships them null), verify storage patterns keep their gated
   safety content, sign off.
3. **Korean language review** — verify names/romanizations.

A record merges only when all three have signed; editorialStatus transitions
follow the site's own ladder. Nothing in this directory is loaded by the site
build or asserted by tests.

Records: 80.
