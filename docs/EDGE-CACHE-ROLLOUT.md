# Static CORS and HTML Edge-Cache Rollout

## Status

The source artifact declares the static-response policy below. It does **not**
create, enable, or prove the required Cloudflare Cache Rule or Cache Response
Rule. Apply the external controls only after the exact deployment has passed
the verification steps in this document.

## Source contract

Cloudflare Pages normally adds `Access-Control-Allow-Origin: *` to static
responses. The global `/*` rule in `public/_headers` detaches that default.
Nothing in the current site has a documented cross-origin embedding need, so
the header is not re-added for `/_astro/*`, social images, HTML, XML, or text.
Re-add it only with a documented consumer, a narrow asset-path rule, and a
live CORS test.

Astro is configured with `trailingSlash: 'always'`. The following header is
therefore intentionally limited to the root route and directory-style HTML
routes:

```text
Cache-Control: public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400
```

The global header block does not set `Cache-Control`. That prevents a second,
conflicting value from being joined onto the existing immutable policy for
hashed `/_astro/*` assets. File endpoints such as `robots.txt`, `sitemap.xml`,
and `feed.xml` do not match the directory-style rule.

Cloudflare Pages applies `_headers` only to static responses. Any future Pages
Function, account route, checkout, personalized response, or form endpoint
must explicitly set its own response headers and must be excluded from the
HTML cache rule before it is deployed.

## Required Cloudflare controls

Configure these rules on the **canonical `kbbqguide.com` hostname only**. Do
not apply them to preview hostnames or a broad `*.kbbqguide.com` expression.

### 1. Cache Rule: make only canonical HTML requests eligible

Create a Cache Rule named `KBBQGuide P2 canonical HTML eligibility` with this
expression:

```text
(http.host eq "kbbqguide.com" and http.request.method in {"GET" "HEAD"} and (http.request.uri.path eq "/" or ends_with(http.request.uri.path, "/")))
```

Use these settings:

- Cache eligibility: **Eligible for cache**.
- Edge TTL: **Use cache-control header if present, bypass cache if not**.
- Browser Cache TTL: **Respect existing headers**.
- Cache key: leave the standard key unchanged; do not vary by cookie, device,
  country, language, or an account-specific header.

The response header's `s-maxage=3600` is the one-hour edge freshness contract;
`max-age=0` keeps browsers revalidating. Do not replace this with a broad
"Cache Everything" rule or an Edge TTL that ignores source cache controls.

### 2. Cache Response Rule: never cache a missing or failed HTML route

Create a Cache Response Rule named `KBBQGuide P2 failed HTML no-store` with
this expression:

```text
(http.host eq "kbbqguide.com" and http.request.method in {"GET" "HEAD"} and (http.request.uri.path eq "/" or ends_with(http.request.uri.path, "/")) and http.response.code ge 400)
```

Use the `set_cache_control` action to set `no-store`. This response-aware rule
is required because a `_headers` file matches the requested path before it can
know whether Pages will serve a 200 page or the shared `404.html` document. It
keeps a newly added route from being masked by a cached 404. It intentionally
does **not** match a successful conditional `304 Not Modified` response or a
normal redirect: neither is a failed HTML route.

Keep this response rule active whenever the eligibility rule is active. Rules
that bypass dynamic paths must run before the eligibility rule. If an eligible
path ever gains cookies, authorization, personalization, a Pages Function, or
a collection form, add a bypass/exclusion first and rerun this rollout.

## Purge on every content deployment

After every production Pages deployment, purge the canonical hostname before
declaring it live. Host purge is intentional here: it clears the cached HTML
inventory and the small static asset set for this site without purging unrelated
hostnames in the zone.

```bash
curl --fail-with-body --request POST \
  "https://api.cloudflare.com/client/v4/zones/${KBBQGUIDE_ZONE_ID}/purge_cache" \
  --header "Authorization: Bearer ${KBBQGUIDE_CF_API_TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{"hosts":["kbbqguide.com"]}'
```

The token needs the zone's **Cache Purge** permission. Never place the token or
zone identifier in this repository. If the production domain is moved or the
zone uses versioned environments, update the purge target and record the
changed procedure before enabling the rule.

## Required live verification

Run these checks on the final canonical deployment after the purge and record
the deployment ID, commit SHA, time, operator, and response headers:

1. `GET` and `HEAD` for `/`, a recipe, a guide, and a menu return 200 with the
   exact source `Cache-Control` value and no `Access-Control-Allow-Origin`.
2. Two consecutive requests from the same test location show a cache fill then
   a cache-served/revalidated response (`CF-Cache-Status` is not `DYNAMIC` or
   `BYPASS`; record `Age` when Cloudflare sends it).
3. `/not-a-real-page/` returns 404 with `Cache-Control: no-store`; it must not
   inherit the successful-page cache policy.
4. `/robots.txt` and `/sitemap.xml` have no `Access-Control-Allow-Origin` and
   do not inherit the directory-style HTML cache contract.
5. Purge the hostname after a harmless deploy, request the homepage again, and
   prove that its deployment marker/commit content is the new candidate.

If any check fails, disable the two external rules, purge `kbbqguide.com`, and
revert the source header change in a new deployment. Do not work around a
failure by broadening CORS or caching preview, personalized, or non-200 pages.

## References

- [Cloudflare Pages custom headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [Cloudflare Pages serving and default response headers](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Cloudflare Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/)
- [Cloudflare Cache Response Rules](https://developers.cloudflare.com/cache/how-to/cache-response-rules/)
- [Cloudflare purge API](https://developers.cloudflare.com/api/resources/cache/methods/purge/)
