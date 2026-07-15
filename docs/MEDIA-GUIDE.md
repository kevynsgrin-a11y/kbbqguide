# Media Guide

## Phase 4 boundary

The interface currently contains no approved image or video assets. Every visible media surface is an explicit CSS placeholder with an immutable plan ID. `data/media-manifest.json` and `docs/media-production-plan.csv` define production work; they do not prove that an asset exists.

Allowed statuses are `placeholder`, `original-approved`, `licensed-approved`, and `synthetic-labeled`. Moving any item out of `placeholder` requires provenance, rights, subject-accuracy, food-safety, cultural, alt-text, caption, crop, intrinsic-dimension, and visual QA evidence.

## Recipe production set

Every recipe plan includes:

- a finished-dish hero with 16:9, 4:3, and 1:1 responsive variants;
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

Use original production whenever practical. Separately licensed assets must have documented scope. Do not scrape, hotlink, or treat an aesthetically similar dish as subject-accurate. Synthetic assets must be explicitly labeled and may not misrepresent traditional context, ingredient identity, yield, texture, smoke, portion, cooking environment, or safe doneness.

Raw and cooked tools, platters, and foods must stay visibly distinct. Thermometer placement, shell-opening behavior, refrigerated holding, fryer setup, grill ventilation, and other safety-critical visuals must match the reviewed written method. Do not stage charcoal, propane, or outdoor appliances indoors.

## Responsive delivery contract

Before activation, every still needs intrinsic dimensions, an approved focal point and mobile crop, AVIF and WebP derivatives plus a fallback, and an accurate final alt decision. Hero media may be prioritized; all below-fold media is lazy loaded. Reserved dimensions must prevent layout shift.

Videos never autoplay with sound. An actual file, poster, captions, reviewed transcript, descriptive title, duration, upload date, provenance, and rights approval are required before a player or VideoObject may appear. A missing asset continues to render as a labeled placeholder.

## Activation checklist

1. Confirm immutable asset and recipe IDs.
2. Record original or licensed provenance and rights scope.
3. Complete food-appearance, subject, cultural, and safety review.
4. Approve alt text, caption, focal point, crops, and dimensions.
5. Produce required responsive formats and verify file weight.
6. For video, attach poster, captions, transcript, duration, and real upload date.
7. Update the manifest status and reference only after every approval is named.
8. Run the Phase 4 media, accessibility, performance, and built-preview gates.
