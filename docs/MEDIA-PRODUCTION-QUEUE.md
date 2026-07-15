# Media Production Queue

Queue owner: unassigned  
Queue status: open  
Machine authority: `data/media-manifest.json`  
Production worksheet: `docs/media-production-plan.csv`  
Checkpoint date: 2026-07-14

The queue contains **80 recipe plans**, zero registered production assets, and **1,040 planned deliverables**: 720 stills, 160 videos, and 160 poster frames. Every current asset reference is a placeholder; every rights status is pending; every recipe media QA status is not started.

## Priority bands

| Priority              | Recipes | Planned deliverables | Purpose                         | Status      |
| --------------------- | ------: | -------------------: | ------------------------------- | ----------- |
| P0 initial cohort     |      28 |                  364 | Minimum public launch candidate | Not started |
| P1 remaining calendar |      52 |                  676 | 13-week follow-on program       | Not started |
| Total                 |      80 |                1,040 | Complete library                | Not started |

Each recipe plan calls for one hero, one finished-dish overhead, one measured-ingredient layout, four critical-step stills, one primary cooking-action still, one serving-table still, one 16:9 long-form video, one 9:16 short-form video, and two poster frames. Shot-list references may reuse an approved still composition, but each declared asset ID must have an explicit final disposition.

## Production workflow

1. Assign producer, food stylist, recipe/test-kitchen owner, cultural reviewer, safety reviewer, accessibility reviewer, and rights owner.
2. Approve recipe method before capture so media never depicts superseded or unsafe instructions.
3. Capture the declared cues, measured ingredients, safe handling, doneness, service context, and center-safe crops without misleading substitutions.
4. Record source files, creator, capture date, model/property releases where applicable, license, territory, duration, modification rights, and expiration.
5. Produce responsive 16:9, 4:3, and 1:1 still variants; poster frames; captioned videos; and transcripts.
6. Review identity, cultural context, food safety, subject accuracy, crop/focal point, color/contrast, alt text, captions, transcripts, compression, and performance.
7. Register only approved assets in `data/media-manifest.json`; replace placeholders in a new release candidate; rerun the full Phase 8 gate and browser QA.

## Acceptance rule

No asset is production-ready until provenance and rights are approved, subject QA passes, accessibility text is human-approved, required transcripts/captions exist, responsive outputs meet the contract, and the release owner records approval. AI-generated or stock imagery must not be used to imply a tested result, a real person, or an authentic documentary context without an explicit, approved policy and disclosure.
