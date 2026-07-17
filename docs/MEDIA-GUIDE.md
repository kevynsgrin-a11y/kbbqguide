# Media Guide

## Phase 9 boundary

The interface now contains 81 active, local hero assets: one brand lifestyle image and one finished-dish hero for each of 80 recipes. Every active asset is an original Phase 9 synthetic campaign image and is explicitly labeled `synthetic-labeled`; none is represented as documentary photography or a test-kitchen result. `data/media-manifest.json` is the machine authority and `docs/media-assets-phase9.csv` is the flat inventory.

Allowed statuses remain `placeholder`, `original-approved`, `licensed-approved`, and `synthetic-labeled`. The active campaign records provenance, rights scope, subject/safety implementation screening, alt and caption decisions, focal points, 2400 × 1600 intrinsic dimensions, and a required human-editorial-review state. Planned process stills and all video continue to be placeholders.

## Recipe production set

Every recipe plan includes an active finished-dish hero plus a retained production plan for:

- a finished-dish overhead;
- a measured ingredient layout;
- four critical-step frames linked to real instruction steps and observable cues;
- a grill or primary-cooking-action frame;
- a serving-table frame;
- a 16:9 long-form video sequence;
- a 9:16 short-form video sequence;
- poster-frame IDs, captions, and reviewed transcript requirements;
- draft alt text and caption, provenance route, rights status, and QA status.

The label “grill action” means the recipe’s primary cooking action when the recipe is not grilled. Final production may rename that visible caption while retaining the locked asset role.

## Photography and food-safety rules

Use original production whenever practical. Separately licensed assets must have documented scope. Do not scrape, hotlink, or treat an aesthetically similar dish as subject-accurate. Phase 9 uses no external stock or scraped photography. Synthetic assets are explicitly labeled in manifest-backed markup and may not be described as photographs, test cooks, or documentary scenes.

Raw and cooked tools, platters, and foods must stay visibly distinct. Thermometer placement, shell-opening behavior, refrigerated holding, fryer setup, grill ventilation, and other safety-critical visuals must match the reviewed written method. Do not stage charcoal, propane, or outdoor appliances indoors.

## Responsive delivery contract

Source masters are local 2400 × 1600 JPEGs. Astro produces AVIF and WebP sources plus JPEG fallback at 360, 640, 960, 1280, and 1600 widths. A build-safe `import.meta.glob` registry prevents missing dynamic asset paths. Detail, category, guide, menu, and home heroes are eager with high fetch priority; cards are lazy. Aspect-ratio reservations prevent layout shift.

Videos never autoplay with sound. An actual file, poster, captions, reviewed transcript, descriptive title, duration, upload date, provenance, and rights approval are required before a player or VideoObject may appear. A missing asset continues to render as a labeled placeholder.

## Activation checklist

1. Confirm immutable asset and recipe IDs.
2. Record original or licensed provenance and rights scope.
3. Complete food-appearance, subject, cultural, and safety review.
4. Approve alt text, caption, focal point, crops, and dimensions.
5. Produce required responsive formats and verify file weight.
6. For video, attach poster, captions, transcript, duration, and real upload date.
7. Update the manifest status and reference only after every approval is named.
8. Run the Phase 9 media, accessibility, performance, and built-preview gates.
