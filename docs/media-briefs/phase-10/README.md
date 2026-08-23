# Phase 10 media remediation briefs

Paste-ready regeneration briefs for the images the 2026-07-17 review flagged (P1-5, P1-6)
plus the duck-breast flag. An automated image pipeline may generate replacement candidates after
operator authorization, but generation never constitutes human approval. Every new immutable
asset must still pass the brief checklist and the five-lane review workbench before release.

## Slot-in path (per brief)

1. Regenerate the image to the exact dimensions in the brief (2400×1600, 3:2 JPEG master).
2. Tick every item in the brief's **Acceptance checklist** — if any item fails, regenerate; do
   not slot in a partial pass.
3. Ingest it:

   ```bash
   npm run media:ingest -- path/to/new-image.jpg --supersedes <oldId>
   # e.g.
   npm run media:ingest -- ~/Downloads/g03-restage.jpg --supersedes G03-hero
   ```

   This validates dimensions/format/aspect-ratio against the superseded asset, installs the
   master, registers a **new immutable id** (`<oldId>-r1`) with `humanEditorialReview: required`,
   and marks the old entry `status: "replaced", replacedBy: <newId>`. Use `--dry-run` first to
   validate without writing.

4. Rebuild (`npm run build`) — responsive WebP derivatives plus JPEG fallbacks (widths 360/600/960/1200) are emitted
   from the new master. The 600px mobile source ceiling is a release budget control. The stable slot id (e.g. `G03-hero`) keeps
   resolving to the new asset via the supersede chain in `src/lib/media.ts`.
5. The new asset then goes through the Phase 10.6 review workbench like any other (all five lanes),
   because ingest never marks anything human-approved.

## Immutable-id rule

Replacements always get a **new** id; superseded entries are marked `replaced`, never deleted
from the manifest. History is preserved.

## Briefs in this folder

| File                                    | Slot (oldId)          | Why                                                                     |
| --------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `G03-tabletop-grill-ventilation.md`     | `G03-hero`            | Fully visible cord + credible ventilation relationship                  |
| `G02-indoor-outdoor-charcoal-safety.md` | `G02-hero`            | Unambiguous open-air charcoal placement + generous structural clearance |
| `HOME-HERO-restage.md`                  | `HOME-gathering-hero` | Raw/cooked/tool separation unclear (P1-6)                               |
| `DUCK-ALT.md`                           | `M19-hero`            | Duck may read as pork / doneness vs recipe endpoint (operator's call)   |
