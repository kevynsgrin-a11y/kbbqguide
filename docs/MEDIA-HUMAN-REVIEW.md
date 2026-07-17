# Phase 9 Human Media Review

Status: **required before public release**  
Scope: 115 active `synthetic-labeled` editorial assets
Machine inventory: `data/media-manifest.json`  
Flat inventory: `docs/media-assets-phase9.csv`

## What has been completed

The Phase 9 implementation screened every promoted master at full composition for subject identity, obvious ingredient conflicts, unsafe doneness or raw/cooked-contact depiction, bivalve shell cues, guest-count accuracy, crop safety, anatomy, artifacts, logos, text, and watermarks. Rejected first passes were replaced rather than promoted: M19 for a rosy duck interior, SF01 for raw shrimp behind a cooked serving, the guides-index frame for raw meat in a planning workspace, the eight-guest menu for showing only six settings, the menu-scaling guide for baked-in calculator numerals, and the media-kit/licensing frames for small device or calibration markings. The promoted set has no implementation-screen failures.

This is an implementation QA pass, not a human editorial approval. No human sign-off is inferred in the manifest.

## Required human review lanes

| Lane                              | Scope                                                    | Required decision                                                            |
| --------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Food editor / test kitchen        | 80 recipe heroes                                         | Dish identity, ingredient plausibility, yield, texture, and serving state    |
| Food-safety reviewer              | All recipes; prioritize meats and seafood                | Doneness, raw/cooked separation, appliance context, shells, and holding cues |
| Korean cultural/language reviewer | All recipe, gathering, category, guide, and menu imagery | Names, context, table setting, adaptation framing, and stereotype avoidance  |
| Accessibility editor              | All 115 assets                                           | Alt decision, final alt text, caption usefulness, and credit clarity         |
| Brand/editorial lead              | All 115 assets                                           | Tone, crop, cohesion, repetition, and release suitability                    |

## Review protocol

1. Review the 2400 × 1600 master and rendered 16:9, 4:3, and mobile crops.
2. Record `pass`, `revise`, or `replace` against the immutable asset ID.
3. Add reviewer name, date, and concise evidence to the manifest QA object.
4. A `revise` or `replace` decision blocks public release for that surface but does not require removing the honest no-index preview.
5. Never change `synthetic-labeled` to `original-approved`; a replacement photographed asset needs its own provenance and status.
