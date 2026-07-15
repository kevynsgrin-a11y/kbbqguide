# Phase 3 Batch 2 Handoff

Checkpoint date: 2026-07-14

## Outcome

Exactly ten additional locked recipe records were promoted from structural stubs to complete editorial drafts:

| ID   | Locked title                              | Draft framing |
| ---- | ----------------------------------------- | ------------- |
| SF04 | Ojingeo Gui Spicy Grilled Squid           | classic       |
| B01  | Baechu Kimchi                             | classic       |
| B02  | Kkakdugi Radish Kimchi                    | classic       |
| B03  | Oi Sobagi Cucumber Kimchi                 | classic       |
| B04  | Baechu Geotjeori Fresh Kimchi             | classic       |
| B05  | Kongnamul Muchim Seasoned Soybean Sprouts | classic       |
| B06  | Sigeumchi Namul Seasoned Spinach          | classic       |
| B07  | Oi Muchim Spicy Cucumber Banchan          | classic       |
| B08  | Musaengchae Spicy Radish Salad            | classic       |
| B09  | Gamja Jorim Soy-Braised Potatoes          | classic       |

The project now contains 20 complete drafts and 60 prose-empty structural stubs. No locked ID, title, category, slug, canonical URL, release cohort, release order, related-recipe list, or menu-pairing list changed. All 80 recipe URLs remain non-indexable.

## Editorial and safety state

Every promoted record remains:

- `editorialStatus: draft`
- `testCookStatus: required`
- `foodSafetyReview: required`
- `koreanLanguageReview: required`
- unpublished, with no reviewer or publication date
- without calculated nutrition, ratings, testimonials, price claims, active affiliate modules, or media claims

SF04 includes whole-squid buying, thawing, cleaning, drying, scoring, grill-surface, sticking, cross-contact, and visual-doneness guidance. B01 and B02 use explicit container-headspace, pressure, refrigeration, and spoilage controls while marking fermentation timing for qualified review. B03 and B04 are intentionally refrigerator-first preparations. B05 explicitly prohibits raw service and cooks soybean sprouts under cover. B06 uses a timed blanch-and-cool method; B07 and B08 are fresh refrigerated salads; B09 includes green-potato rejection, tender-center cues, and hot-syrup handling.

## Evidence and source policy

Recipe conventions were checked against Maangchi's ojingeo-tonggui, tongbaechu-kimchi, kkakdugi, oi-sobagi, baechu-geotjeori, kongnamul-muchim, sigeumchi-namul, oi-muchim, musaengchae, and algamja-jorim references. Seafood doneness and cold-storage language were checked against FoodSafety.gov. These sources support convention and safety framing; they do not substitute for test cooking, qualified fermentation review, or human approval.

## Human review queue

1. Test-cook every draft and reconcile yields, salting ratios, spice level, active time, drain time, grill output, vegetable texture, and glaze reduction.
2. Have a qualified fermentation-safety reviewer approve B01 and B02 room-temperature options, container guidance, spoilage language, and future shelf-life claims.
3. Have a qualified food-safety reviewer approve whole-squid handling, sprout cooking, cold-storage windows, and cross-contact controls.
4. Have a qualified Korean-language reviewer approve Hangul, romanization, naming, and the relationship between locked titles and common Korean names.
5. Have a Korean food editor review cultural context and every `classic` label without treating a single-source formula as universal.
6. Run allergen review for fish, shellfish, soy, wheat/gluten, and sesame.
7. Do not change a review gate to `approved` without a named human reviewer and evidence in the future test-kitchen/review log.

## Verification gate

Run:

```bash
npm run validate:phase3-batch2
npm run check
npm run audit
```

The Batch 2 gate verifies the exact 20 promoted IDs, 60 remaining stubs, schema validity, identity and relationship locks, non-indexability, review status, preparation-specific safety structures, and the next-batch checkpoint.

## Next authorized action

Phase 3 Batch 3 may promote only `F01`–`F03`, `SA01`–`SA03`, `D01`–`D02`, and `M08`–`M09`, corresponding to public release orders 21–30. Stop after those ten records, rerun the full gate, and package a separate checkpoint. Production publishing and deployment remain unauthorized.
