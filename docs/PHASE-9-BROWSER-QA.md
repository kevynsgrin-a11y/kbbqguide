# Phase 9 Browser QA

Status: **local production-build pass; public branch-preview verification pending**  
Checkpoint date: 2026-07-16

## Responsive route matrix

Headless Chromium checked 21 representative routes at 390 × 844, 768 × 1024, 1440 × 900, and 1920 × 1080, for **84 of 84 passing viewport-route checks**:

- home and all six recipe categories;
- representative grilled-meat, seafood, banchan, fresh, sauce, and dessert recipes;
- guide index and detail;
- menu index and four-guest detail;
- tools and Shop;
- affiliate and sponsored-content policy routes.

Every check returned successful HTML with exactly one H1 and main landmark, no duplicate ID, empty link, visible broken image, horizontal overflow, console error, page error, or failed request. A separate 1440-pixel eager-load sweep requested every lazy image on each representative route and found zero broken assets. Across the matrix the browser rendered 548 image elements and observed 561 successful resource responses.

## Responsive crops and visual inspection

The home hero was inspected at all four required widths. The mobile crop keeps the headline, subject, CTAs, and disclosure context readable; the 768 crop preserves the primary subject and table; the 1440 and 1920 crops expand the gathering without weakening text contrast. Category cards keep dish identity legible from one to three columns. Recipe and guide heroes retain their subjects inside rounded 4:3 frames. No overlap, clipping, accidental stretching, or misleading crop was found.

Ten captures are retained in `docs/screenshots/phase9/`:

- `home-before-390.jpg` and `home-after-390.jpg`;
- `home-before-1440.jpg` and `home-after-1440.jpg`;
- `home-after-768.jpg` and `home-after-1920.jpg`;
- `category-after-768.jpg`, `recipe-after-1440.jpg`, `guide-after-1440.jpg`, and `menu-after-390.jpg`.

The first full-page category capture showed unloaded frames below the viewport because Chromium preserves native lazy loading during a single stitched screenshot. This was an evidence-capture issue, not an asset failure: the matrix had no failed requests. The capture was repeated after an explicit eager-load sweep, and all 20 grilled-meat cards rendered their registered images.

## Interaction, motion, print, and performance smoke

- First Tab reached the skip link; Enter moved focus to `main-content`.
- The native mobile menu opened with Enter, closed with Escape, and returned to its closed state.
- The matrix ran in a reduced-motion browser context without hiding or disabling content.
- Print emulation hid the site header while preserving the representative recipe main content and ingredients.
- Maximum local LCP observation: **88 ms**; maximum CLS: **0**. These are local smoke measurements, not field Core Web Vitals.

## Remaining manual gates

The public Cloudflare branch preview must repeat the representative smoke after deployment. Named human checks remain required for physical-device crops, 200%/400% zoom, assistive technology, food and safety accuracy, Korean cultural/language context, accessibility copy, brand release, and final media approval. No browser automation result grants public-release authorization.
