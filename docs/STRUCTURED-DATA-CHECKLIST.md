# Structured Data and Discovery Checklist

Checkpoint date: 2026-07-14

## Preview contract

- Every HTML page uses the reserved `https://kbbqguide.com` origin.
- Every HTML page emits one unique self-referencing canonical, matching Open Graph URL, unique title, and description.
- Every HTML page remains `noindex,nofollow,noarchive`.
- `robots.txt` disallows the complete preview and references the preview sitemap index.
- The preview sitemap contains all 108 rendered HTML routes so build validation can compare route and canonical coverage.
- The Atom feed is structurally present but intentionally contains no entries because no recipe or guide is approved or published.

## JSON-LD contract

- Recipe pages: one `Recipe` and one `BreadcrumbList` block.
- Recipe JSON-LD omits image, video, nutrition, rating, review, price, publication date, and tested-status claims.
- Recipe JSON-LD is not expected to qualify for a rich result until approved real imagery and every required human review exist.
- Category, recipe-index, guide-index, menu-index, menu-detail, home, and HTML-sitemap collection pages use `ItemList` only for visible linked items.
- Pages with visible breadcrumbs use `BreadcrumbList` with the same registry-resolved paths.
- Organization, Person, WebSite, VideoObject, Product, Offer, Review, and AggregateRating are intentionally absent because their production entities or evidence are incomplete.

## Production activation gate

Before replacing the preview origin or allowing indexing:

1. Replace brand, legal-name, domain, author, contact, and social-profile placeholders.
2. Complete editorial, test-kitchen, food-safety, and Korean-language approval for every recipe to be published.
3. Approve each guide and menu through the applicable safety, cultural, editorial, and accessibility reviews.
4. Add only licensed, subject-accurate media with dimensions, alt text, captions, provenance, and rights records.
5. Revalidate Recipe JSON-LD against current Schema.org vocabulary and Google rich-result requirements.
6. Validate representative URLs in the production Search Console and rich-results tools.
7. Replace the empty preview feed with approved publication entries and real timestamps only after publication.
8. Generate the production sitemap from the final indexable set; do not list blocked drafts.
9. Recheck canonical, redirect, trailing-slash, hreflang-if-any, Open Graph, favicon, and web-manifest behavior on the production origin.
10. Repeat the complete crawl and confirm zero duplicate canonicals, broken links, blocked production assets, or unintended indexable drafts.
