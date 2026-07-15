# Phase 4 UI, Pages, Media, and Motion Handoff

Checkpoint date: 2026-07-14

## Outcome

Phase 4 implements a static, non-production interface around the locked 80-draft corpus. The build now emits one home page, one recipe index, six category pages, and 80 recipe pages through one shared renderer: 88 static pages total. All live internal links resolve through immutable URL-registry IDs.

Every generated page inherits one layout with a skip link, landmarks, responsive navigation, explicit preview status, `noindex,nofollow,noarchive`, and a global footer. Phase 5/6 destinations remain visibly reserved but are not linked, so Phase 4 introduces no broken placeholders.

## Shared recipe contract

The recipe renderer exposes title and Korean naming, draft gates, context, time and yield, ingredients, equipment, every instruction and its sensory/safety cues, permanently visible food-safety notes, allergens, substitutions, sourcing, storage, reheating, FAQ, related recipes, and media/video placeholders. Meat and seafood records activate their required conditional sections from the same component.

Recipe content, ingredients, instructions, and safety notes are server-rendered and remain available without JavaScript. JavaScript is limited to print activation and an Escape/focus-return enhancement for the native mobile navigation disclosure. Print CSS removes navigation and media while preserving recipe and safety content.

## Media and motion state

`data/media-manifest.json` contains 80 placeholder production plans. `docs/media-production-plan.csv` provides one auditable row per recipe. Each plan includes a hero, overhead, ingredient layout, four critical steps, primary cooking action, serving table, long and short video sequences, poster frames, alt/caption drafts, transcript requirement, provenance route, rights status, and QA state.

No image or video is claimed. The manifest’s actual-assets array is empty, recipe data still has no active media IDs, and the UI renders labeled CSS placeholders. The visual layer uses CSS depth, card tilt, and view transitions only as progressive enhancement; reduced-motion preferences remove them, touch devices do not depend on hover, and no WebGL or third-party script is present.

## Verification

Run:

```bash
npm run validate:phase4
npm run build
npm run check
npm run audit
```

The Phase 4 gate validates the shared renderer, 80 recipe routes, six category configurations, preview indexing lock, registry-based links, conditional meat/seafood sections, keyboard/no-JavaScript/print/reduced-motion contracts, 80 media plans, and 80-row production CSV.

After the static build, `validate:preview` crawls all 88 HTML files, requires unique titles and preview robots directives, verifies every emitted internal link, confirms all 80 recipe pages expose placeholders and safety content without real image/video markup, and enforces the initial compressed CSS and recipe-route JavaScript budgets.

## Representative browser and manual QA

The representative set is home, grilled-meat category, banchan category, M01 meat recipe, SF12 live-shellfish recipe, B24 refrigerator-pickle recipe, and D05 cooked-rice dessert drink. Headless Chromium passed all seven at 1440×900 and 390×844, for 14 of 14 viewport-route checks. Four full-page captures were visually inspected. Mobile Escape/focus return, reduced motion, disabled JavaScript, print styles, landmarks, safety visibility, placeholder honesty, console errors, and horizontal overflow passed. See `docs/PHASE-4-BROWSER-QA.md`.

Named human review is still required at additional viewport and zoom combinations, with a screen reader, on paper, and after real media exists. Automated checks do not replace cognitive-load, subject-accuracy, cultural, or physical-device review.

## Next action

Phase 5 may add the 12 locked guides, menu pages, serving and marinade scalers, menu/shopping/prep/equipment tools, non-medical allergen display, valid structured data, sitemap/robots/feed, and expanded internal-link validation. Preserve the 80-draft corpus, shared renderer, URL registry, media honesty, safety content, no-index preview status, and all human gates. Do not publish or deploy.
