# Search launch runbook

Status: blocked until the release-state gate is `public-launch`, reviewed
content is indexable, and `data/search-launch-log.json` is updated by the
named owner. This runbook never authorizes an indexing change.

## Preconditions

1. Confirm the canonical apex and `www` hostnames resolve to the intended
   production deployment over HTTPS.
2. Confirm `/sitemap.xml` returns XML containing only canonical, HTTP 200,
   indexable routes with meaningful record-derived `lastmod` values.
3. Confirm no unreviewed recipe, guide, menu, tool, policy, or commercial page
   appears in the sitemap or an indexable promotional module.
4. Record a named release owner and a completed human-review evidence packet
   for the representative recipe before seeking its indexing.

## Submit and inspect

1. Verify both apex and `www` variants in Google Search Console and Bing
   Webmaster Tools. Record each verification outcome and its UTC timestamp in
   the launch log.
2. Submit `https://kbbqguide.com/sitemap.xml` in both systems and record the
   acceptance timestamp; never record a requested submission as accepted.
3. Inspect and request indexing, only where eligible, for the homepage,
   recipes index, one category, one fully reviewed recipe, one guide, one menu,
   and planning tools. Record both inspection and request timestamps; the exact
   registry IDs are locked in the launch log.
4. For 30 days, review Page Indexing, Crawl Stats, Core Web Vitals, HTTPS, and
   Recipe enhancements weekly. Record each UTC check timestamp and a concise
   finding for weeks 1–4. Record canonical, soft-404, and rich-result errors in
   the `issues` array with the affected route and remediation link.
5. Record the first confirmed indexed date. Do not infer it from a `site:`
   search result alone.

## Evidence discipline

- `data/search-launch-log.json` is the portfolio launch record. Preserve prior
  error evidence; append a correction rather than overwriting history.
- A `ready` or `complete` status is valid only after the facts in that record
  are present and the release state is indexable.
- Search submission is operational work, not a substitute for crawlability,
  canonical correctness, or review evidence.
