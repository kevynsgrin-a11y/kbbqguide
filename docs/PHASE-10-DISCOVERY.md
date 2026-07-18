# Phase 10 — Discovery

_Discovery record produced at the start of Phase 10 release hardening, per §1.7 and §4.2
of the Phase 10 master directive. Everything below was read from the repository at the
Phase 10 base commit, not assumed._

- **Base commit (working branch tip at Phase 10 start):** `f2a8cc2` — the merge of PR #2
  (`phase-9-visual-editorial-overhaul`) into `main`. This is the reviewed Phase 9 lineage
  (`8cfef87` "docs: record public preview QA" and `949c213` "feat: complete phase 9 editorial
  media system" are its ancestors). The branch head advances with each Phase 10 commit; the
  final HEAD is recorded in `docs/PHASE-10-STATUS.md`.
- **Working branch:** `claude/document-instructions-25h9z9` (see deviation note in
  `docs/GOVERNANCE.md` — the session was provisioned with this branch and an explicit,
  operator-confirmed instruction to use it instead of the directive's `phase-10/release-hardening`).

## Toolchain / framework

- **Framework:** Astro `7.0.9` (`astro.config.mjs`), static output (`output: 'static'`,
  `build.format: 'directory'`, `trailingSlash: 'always'`), `site: 'https://kbbqguide.com'`,
  `security.checkOrigin: true`, sourcemaps disabled.
- **Runtime:** Node `>=24` per `package.json` engines and `.node-version` (`24`). **Note:**
  this Phase 10 environment runs Node `v22.22.2`. The build, tests, and validators still run
  clean here, but CI and the operator should build on Node 24 to match the pinned toolchain.
- **Language/validation:** TypeScript, Zod `4.4.3` for content schemas, Vitest `4.1.10` for
  tests, ESLint + Prettier.

## Build command and output

- **Build command:** `npm run build` →
  `npm run validate:phase9 && astro build && npm run validate:preview && npm run validate:headers`.
  - `validate:phase9` runs the full Vitest chain (phases 1–9).
  - `validate:preview` = `node scripts/validate-built-preview.mjs` (crawls `dist/` HTML).
  - `validate:headers` = `node scripts/validate-security-headers.mjs` (checks `dist/_headers`).
- **Output directory:** `dist/` (git-ignored). Produces **116 static HTML pages**, all carrying
  `<meta name="robots" content="noindex,nofollow,noarchive">` (verified: 116/116).
- **Dev server:** `npm run dev` (`astro dev`). Preview built output: `npm run preview`.

## Route inventory (generated URLs)

116 HTML pages. Full list captured in `qa/phase-10/` during Phase 10.5. Summary:

| Group | Count | Examples |
|---|---|---|
| Home | 1 | `/` |
| Recipe index | 1 | `/recipes/` |
| Category indexes | 6 | `/recipes/grilled-meat/`, `/recipes/seafood/`, `/recipes/banchan/`, `/recipes/fresh/`, `/recipes/sauces/`, `/recipes/desserts/` |
| Recipe detail pages | 80 | `/recipes/grilled-meat/classic-korean-pear-beef-bulgogi/`, `/recipes/seafood/gochujang-grilled-shrimp/`, `/recipes/grilled-meat/korean-style-grilled-duck-breast/`, `/recipes/banchan/gyeran-mari-rolled-omelet/` |
| Guide index | 1 | `/guides/` |
| Guide pages | 12 | `/guides/tabletop-grill-and-ventilation/`, `/guides/indoor-vs-outdoor-korean-bbq-safety/`, … |
| Menu index | 1 | `/menus/` |
| Menu pages | 3 | `/menus/2-guests/`, `/menus/4-guests/`, `/menus/8-guests/` |
| System / policy / tools | 11 | `/`, `/start-here/`, `/tools/`, `/shop/`, `/newsletter/`, `/media-kit/`, `/live-class/`, `/sitemap/`, `/affiliate-disclosure/`, `/brand-partnerships/`, `/licensing-inquiry/`, `/sponsored-content-policy/` |
| Non-HTML routes | — | `/robots.txt`, `/feed.xml`, `/sitemap-index.xml`, `/sitemap-preview.xml`, `/site.webmanifest`, `/_headers`, `/favicon.svg`, `/social/kbbqguide-home.jpg` |

Route → recipe/category/menu IDs are resolved through `data/url-registry.json` via
`src/lib/url-registry.ts` (`registryPathById`). Category slugs live in `src/lib/categories.ts`;
menu slugs (`{guests}-guests`) in `src/lib/menus.ts`; guide slugs in `src/lib/guides.ts`.

## Media manifest

- **Path:** `data/media-manifest.json` (`version: 4`, `phase: 9`).
- **Assets:** **115 active image assets**, all `assetStatus: "synthetic-labeled"`, all real
  full-resolution generated JPEGs (2400×1600, ~500–670 KB each) under `src/assets/media/`.
  Roles: 1 `brand-lifestyle-hero` (home), 80 `finished-dish-hero` (recipes), 6
  `category-editorial-hero`, 12 `guide-editorial-hero`, 3 `menu-editorial-hero`, 3
  `collection-editorial-hero`, 8 `system-editorial-hero`, 1 `brand-lifestyle-banner`, 1
  `policy-editorial-banner`.
- **Schema per asset (key fields):** `assetId` (immutable), `kind`, `role`, `assetStatus`,
  `path`, `width`, `height`, `aspectRatio`, `focalPoint`, `mobileCrop`, `altDecision`
  (`informative`/`decorative`), `altText`, `caption`, `credit`, `provenance{creator,
  generatedAt, sourceRecord, promptBasis, disclosure}`, `rights{source, scope, externalLicense}`,
  `qa{implementationVisualReview, implementationFoodSafetyScreen,
  implementationCulturalAndIngredientScreen, responsiveCropReview, humanEditorialReview,
  reviewer}`. `humanEditorialReview` is currently a **string** `"required"`; Phase 10.6 extends
  it to the lane object defined in §10 of the directive.
- **Contracts in the manifest:** `responsiveImageContract` (formats avif/webp/jpeg; widths
  360/640/960/1280/1600), `stillShotContract`, `videoContract`.

## Where alt text lives

- **Live alt text is the manifest `altText` field.** It is rendered by
  `src/components/ResponsiveMedia.astro`:
  `alt={media.altDecision === 'decorative' ? '' : media.altText}`.
- `resolveMedia(mediaId)` (`src/lib/media.ts`) looks up the manifest entry by `assetId` and
  binds the imported `ImageMetadata`. Components pass a `mediaId` (e.g. `` `${recipe.id}-hero` ``).
- `MediaPlaceholder.astro` renders the real `ResponsiveMedia` when the asset resolves, otherwise
  a placeholder figure using the component-level `altDraft` prop. **`altDraft` props in
  `.astro` files are only used when an asset is absent** — for the 115 active assets, the
  manifest `altText` is authoritative. Phase 10.3 therefore writes alt proposals into the
  manifest, not into templates.

## Where credits / disclosure render

- `src/components/MediaCredit.astro` renders `<figcaption class="media-credit">` with the
  manifest `caption` + `credit`. It is emitted by `ResponsiveMedia.astro` only when
  `showCredit` is true (heroes/banners pass `showCredit`).
- The synthetic-content `disclosure` string is also emitted as a `data-disclosure` attribute on
  the figure. The **home hero** currently renders via `EditorialHero` → `MediaPlaceholder` →
  `ResponsiveMedia`; its nearest visible credit belongs to a later editorial banner
  (`EditorialBanner`), which is the placement gap called out in P1-8.
- Disclosure/credit styling: `.media-credit` in `src/styles/global.css` (size/contrast audited
  and corrected in Phase 10.3; see `docs/DISCLOSURE-AUDIT.md`).

## Where taxonomy chips render

- **`src/components/RecipeCard.astro`** eyebrow: `Draft {recipe.id} · {recipe.adaptationLabel}`.
  When `adaptationLabel` is `"none"` (F01, M05, M06, M07) this renders `Draft M05 · none`,
  which the `.eyebrow` uppercase styling shows as **`DRAFT M05 · NONE`** — the P1-9 taxonomy leak.
- **`src/components/RecipePage.astro`**: hero eyebrow `{category.label} · Draft {recipe.id}`
  (safe) and a `badge-row` whose first badge is `{recipe.adaptationLabel}` (leaks `none`).
- **`src/pages/menus/[guests].astro`**: menu cards render `{recipe.category}` — the **raw slug
  `grilled-meat`** — a second, previously-unlisted taxonomy leak fixed in Phase 10.2.
- Category identity is defined in `src/lib/categories.ts` (`categoryBySlug(slug).label`).

## Where ingredient data lives / how shopping lists are computed

- **Recipe data:** `src/content/recipes/*.json` (80 complete recipes + drafts), validated by
  `src/schemas/recipe.ts`. Each ingredient has `metricAmount`, `metricUnit`, `customaryAmount`,
  `customaryUnit`, `item`, `preparation`, `optional`.
- **Ingredient line rendering:** `src/components/RecipePage.astro` `measure()` joins
  `metric / customary` then appends `item`. The **duplicate-noun bug** (`1 scallion scallion`,
  `6 large eggs large eggs`) is caused by `customaryUnit` holding a count-noun equal to `item`
  (e.g. unit `"scallions"`, item `"scallions"`). Fixed at the rendering source in Phase 10.2
  (`src/lib/ingredients.ts`).
- **Consolidated shopping lists:** `src/lib/planner.ts` `consolidateShoppingList(recipes, servings)`
  keys rows on `` `${item.toLowerCase()}|${unit}` `` and rounds to 2 decimals — the source of
  `333.33 g` (rounding) and of duplicate concepts (`scallion` vs `scallions`, `gochujang` vs
  `Korean gochujang`, `honey` twice). Consumed by `src/pages/menus/[guests].astro` and
  `src/components/PlannerTools.astro`. Phase 10.2 re-keys consolidation on a canonical ingredient
  id (`data/ingredient-canonical.json`) and rounds at the display layer only.
- **Scaling:** `src/lib/scaling.ts` `scaleQuantity(base, baseServings, targetServings)`.

## Tests / validators (existing harness)

- Vitest suites `tests/phase1..9.test.ts` plus `recipe-schema`, `scaling`, `url-registry`,
  `affiliate-links`. Run via `npm test` or the `validate:phaseN` chain.
- `scripts/validate-built-preview.mjs` and `scripts/validate-security-headers.mjs` gate the build.
- No content-lint or accessibility harness existed before Phase 10; Phase 10 adds
  `npm run lint:content` and an axe/structural suite.

## Production / deployment config in repo

- **No** `wrangler.toml`, `_redirects`, or Workers config. `public/_headers` carries the CSP +
  seven-header policy (emitted to `dist/_headers`), consumed by Cloudflare Pages.
- Target is Cloudflare Pages, build `npm run build`, output `dist` (per README +
  `docs/DEPLOYMENT-RUNBOOK.md`). The apex 502 diagnosis is in `docs/ops/ORIGIN-DIAGNOSIS-2026-07.md`.
