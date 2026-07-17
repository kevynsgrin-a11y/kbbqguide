# Media Production Queue

Queue owner: unassigned  
Queue status: open  
Machine authority: `data/media-manifest.json`  
Production worksheet: `docs/media-production-plan.csv`  
Checkpoint date: 2026-07-17

The queue contains **115 active editorial assets** (80 finished dishes plus 35 brand, category, guide, menu, system, and policy frames) and the retained **80 recipe plans**. Phase 9 completes every major site entry point and the hero slot for every recipe. The remaining queue contains **960 planned deliverables**: 640 non-hero recipe stills, 160 videos, and 160 poster frames. Remaining process/video references are placeholders; active assets are `synthetic-labeled` with local source, provenance, rights scope, dimensions, alt/caption/credit decisions, and implementation QA.

## Priority bands

| Priority              | Recipes | Planned deliverables | Purpose                      | Status      |
| --------------------- | ------: | -------------------: | ---------------------------- | ----------- |
| P0 initial cohort     |      28 |                  336 | Complete non-hero capture    | Not started |
| P1 remaining calendar |      52 |                  624 | Complete non-hero capture    | Not started |
| Total                 |      80 |                  960 | Remaining library production | Not started |

Each recipe now has its hero. The remaining plan calls for one finished-dish overhead, one measured-ingredient layout, four critical-step stills, one primary cooking-action still, one serving-table still, one 16:9 long-form video, one 9:16 short-form video, and two poster frames. Shot-list references may reuse an approved still composition, but each declared asset ID must have an explicit final disposition.

## Production workflow

1. Assign producer, food stylist, recipe/test-kitchen owner, cultural reviewer, safety reviewer, accessibility reviewer, and rights owner.
2. Approve recipe method before capture so media never depicts superseded or unsafe instructions.
3. Capture the declared cues, measured ingredients, safe handling, doneness, service context, and center-safe crops without misleading substitutions.
4. Record source files, creator, capture date, model/property releases where applicable, license, territory, duration, modification rights, and expiration.
5. Produce responsive 16:9, 4:3, and 1:1 still variants; poster frames; captioned videos; and transcripts.
6. Review identity, cultural context, food safety, subject accuracy, crop/focal point, color/contrast, alt text, captions, transcripts, compression, and performance.
7. Register only approved assets in `data/media-manifest.json`; replace placeholders in a new release candidate; rerun the full Phase 9 gate and browser QA.

## Acceptance rule

No remaining asset is production-ready until provenance and rights are approved, subject QA passes, accessibility text is human-approved, required transcripts/captions exist, responsive outputs meet the contract, and the release owner records approval. Phase 9 hero images may be used in the no-index preview because their synthetic status and provenance are explicit; human editorial sign-off is still required before public release.
