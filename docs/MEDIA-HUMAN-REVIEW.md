# Phase 9 Human Media Review

Status: **required before public release**  
Scope: 81 active `synthetic-labeled` hero assets  
Machine inventory: `data/media-manifest.json`  
Flat inventory: `docs/media-assets-phase9.csv`

## What has been completed

The Phase 9 implementation screened every promoted master at full composition for subject identity, obvious ingredient conflicts, unsafe doneness or raw/cooked-contact depiction, bivalve shell cues, crop safety, artifacts, logos, text, and watermarks. Two first-pass generations were rejected and replaced: M19 for a rosy duck interior that conflicted with the recipe’s safe-doneness cue, and SF01 for raw shrimp appearing behind a cooked serving. The promoted set has no implementation-screen failures.

This is an implementation QA pass, not a human editorial approval. No human sign-off is inferred in the manifest.

## Required human review lanes

| Lane                              | Scope                                                      | Required decision                                                            |
| --------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Food editor / test kitchen        | 80 recipe heroes                                           | Dish identity, ingredient plausibility, yield, texture, and serving state    |
| Food-safety reviewer              | All recipes; prioritize meats and seafood                  | Doneness, raw/cooked separation, appliance context, shells, and holding cues |
| Korean cultural/language reviewer | 80 recipe heroes plus home                                 | Names, context, table setting, adaptation framing, and stereotype avoidance  |
| Accessibility editor              | All 81 assets                                              | Alt decision, final alt text, caption usefulness, and credit clarity         |
| Brand/editorial lead              | Home, six category aliases, guides, menus, system surfaces | Tone, crop, repetition, and release suitability                              |

## Review protocol

1. Review the 2400 × 1600 master and rendered 16:9, 4:3, and mobile crops.
2. Record `pass`, `revise`, or `replace` against the immutable asset ID.
3. Add reviewer name, date, and concise evidence to the manifest QA object.
4. A `revise` or `replace` decision blocks public release for that surface but does not require removing the honest no-index preview.
5. Never change `synthetic-labeled` to `original-approved`; a replacement photographed asset needs its own provenance and status.
