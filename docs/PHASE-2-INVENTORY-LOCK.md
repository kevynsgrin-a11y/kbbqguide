# Phase 2 Inventory Lock

Phase 2 creates structure only. `data/recipe-inventory.json` is the locked inventory; `data/release-matrix.json` locks launch/scheduling assignments; `data/recipe-relationship-graph.json` defines initial related and menu-pairing IDs. The URL registry remains authoritative for paths.

## Counts

| Category               |  Total | Initial launch | Remaining |
| ---------------------- | -----: | -------------: | --------: |
| Grilled meat           |     20 |              7 |        13 |
| Seafood                |     15 |              4 |        11 |
| Banchan                |     25 |              9 |        16 |
| Fresh / palate refresh |     10 |              3 |         7 |
| Sauces                 |      5 |              3 |         2 |
| Desserts               |      5 |              2 |         3 |
| **Total**              | **80** |         **28** |    **52** |

The remaining 52 records are assigned to 13 weeks of four recipes, using the exact category schedule in the project specification.

## Stub contract

Every file in `src/content/recipes/` contains all required recipe field names but no recipe prose: content fields are null or empty, Korean-language fields are null, media references are empty, nutrition is not calculated, and all human review statuses remain required. Relationship and release metadata are the only populated operational fields beyond locked identity/title/category/URL data.

Phase 3 must promote at most 10 stubs per batch to `contentStatus: complete`. It may not overwrite the locked ID, inventory title, category, slug, canonical URL, release cohort, or order. A complete record must pass the original strict schema and remain draft/review-required until human approval.
