# Phase 5 SEO, Guides, Menus, and Tools Handoff

Checkpoint date: 2026-07-14

## Outcome

Phase 5 expands the non-production static preview from 88 to 108 HTML pages. The added routes are Start Here, one guide index, 12 guide drafts, one menu index, three guest-count menu pages, one planning-tools page, and one human-readable sitemap. Five new URL-registry IDs cover the three menu details, tools, and HTML sitemap; all pre-existing locked IDs and paths remain unchanged.

The 12 guide drafts are distinct, four-checkpoint planning documents. They cover beginner flow, indoor/outdoor safety, appliances and ventilation, pantry, meat cuts, seafood, ssam, menus, prep timelines, banchan, cleanup, and leftovers. Safety-facing language remains subordinate to the project safety standard and named human review.

## Menus and progressive tools

Menus for two, four, and eight link only to immutable recipe IDs. Each has workload-aware service order, equipment checks, a visible scaling warning, and a server-rendered shopping list generated from the selected recipe quantities. The consolidator uses metric quantities when present, falls back to customary quantities, preserves source recipe IDs, and makes no price, stock, package, or yield-testing claim.

The tools page includes a servings scaler, marinade scaler, guest-count menu builder, consolidated shopping-list generator, prep-timeline generator, equipment checklist, and non-medical allergen filter. It sends no data and stores no selections. Core explanations, the default menu/list, all equipment items, all recipe links, and explicit limitations remain available without JavaScript.

The allergen display only hides records carrying selected draft flags. It never promises medical safety or absence of cross-contact; users are directed back to labels, recipe details, and qualified medical guidance where needed.

## SEO and discovery state

Every HTML page emits a unique title, description, reserved `.invalid` preview canonical, matching Open Graph URL, favicon reference, web-manifest reference, and `noindex,nofollow,noarchive`. Recipe pages add honest `Recipe` and `BreadcrumbList` JSON-LD without images, videos, nutrition, ratings, reviews, publication dates, or testing claims. Visible collection pages add matching `ItemList` data.

The build emits `robots.txt`, `sitemap-index.xml`, `sitemap-preview.xml`, `feed.xml`, `site.webmanifest`, `favicon.svg`, and `/sitemap/`. Robots disallows the complete preview. The sitemap is a QA inventory of all 108 `.invalid` preview canonicals. The Atom feed contains no entries because nothing is approved or published. See `docs/STRUCTURED-DATA-CHECKLIST.md` for the production activation gate.

## Verification

Run:

```bash
npm run validate:phase5
npm run build
npm run check
npm run audit
```

The Phase 5 test gate validates the 12 guides, three menus, seven tool capabilities, deterministic shopping-list consolidation, registry additions, preview-safe structured data, discovery endpoints, preserved draft gates, and Phase 6-only next action. The post-build crawler validates 108 unique HTML pages and canonicals, every internal link, 80 honest Recipe JSON-LD pages, 12 guide pages, three menu pages, tool fallbacks, complete sitemap parity, feed silence, preview robots, and performance budgets.

Representative browser QA passed 12 of 12 desktop/mobile route checks plus menu, shopping-list, timeline, allergen, equipment, scaling, mobile-focus, no-JavaScript, and print interactions. Four full-page captures were visually inspected. See `docs/PHASE-5-BROWSER-QA.md`.

## Human review still required

The guides, menus, planning outputs, and structured-data production policy require editorial, food-safety, Korean-language/cultural, accessibility, and legal review as applicable. A manual screen-reader pass, physical-device checks, real-media QA, test cooking, provider configuration, production-origin validation, and deployment authorization remain unresolved. No production deployment, indexing activation, analytics, affiliate link, email capture, or remote write is authorized by this checkpoint.

## Next action

Phase 6 may add the locked affiliate registry and safe link builder, disclosures, disabled ad slots, digital-product and class placeholders, 90-day social calendar, email automation map, messaging plan, and analytics event plan. Preserve all draft and preview gates. Do not publish or deploy.
