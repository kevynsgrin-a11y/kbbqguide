# QA Plan and Phase Handoff

## Automated suites by phase

- Phase 1: formatting, lint, typecheck, schema unit tests, slug/URL lookup, safe affiliate builder, scaling, route-registry uniqueness, document presence, zero recipe records, static build, dependency audit.
- Phase 2: exact category and total counts, immutable IDs/slugs, empty validated stubs, related graph integrity, URL collisions.
- Phase 3: batch schema/editorial/safety/link checks; no more than 10 recipes; unique prose and required review statuses.
- Phase 4–6: representative template accessibility/integration tests, no-JavaScript and print, media references, SEO/JSON-LD, forms, disclosures, monetization and consent.
- Phase 7: full crawl, viewport/keyboard/screen-reader/reduced-motion review, headers/privacy, performance smoke, critical/high defect repair loop.

## Phase 1 acceptance

- [ ] Runtime and package manager recorded.
- [ ] Stack and target locked without silent fallback.
- [ ] Project brief, decisions, risks, IA, URL policy/registry, schema, design contracts, editorial/safety standards, accessibility/performance/security plans exist.
- [ ] Registry has no duplicate ID, path, or canonical and uses one trailing-slash policy.
- [ ] Recipe schema enforces human review status and category-specific meat/seafood fields.
- [ ] Exactly zero recipe data records exist.
- [ ] All local checks and static build pass; dependency audit has no unresolved high/critical issue.

## Handoff rule

Read `project-state.json` first. Phase 2 may add only the locked 80-item inventory, immutable IDs/slugs, validated stubs, URL entries, and related/menu graph. It may not generate recipe prose or change a locked decision without a dated incompatibility record.
