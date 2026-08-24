# KBBQGuide audit remediation record

**Domain:** `kbbqguide.com`<br>
**Original audit:** August 10, 2026<br>
**Remediation review:** August 23, 2026<br>
**Release posture:** live technical deployment remains a no-index editorial preview; it is not an approved indexed-content launch.

## Decision-grade summary

All six P2 implementation items are now addressed in the release candidate.
The P0/P1 work is likewise represented by fail-closed source controls, rather
than fabricated legal, editorial, or commercial claims. The candidate may be
deployed safely to the active domain as a technical no-index preview. It must
not be treated as ready for public indexing, monetization, or food-content
publication until the outstanding accountable approvals below are completed.

Status terms used below:

| Status                          | Meaning                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Verified**                    | Implemented and covered by automated/build or deployed-route verification.                      |
| **Enforced pending evidence**   | The site fails closed; a real-world owner, factual record, or approved asset is still required. |
| **External operation pending**  | Source is ready, but a host/search/admin action is required outside this repository.            |
| **Intentional policy decision** | The audit option was deliberately selected and tested.                                          |

## Final remediation ledger — all original findings

### P0

|   # | Finding                                     | Remediation and current status                                                                                                                                                                                                                                                                                                                                                |
| --: | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Public preview/launch hybrid                | **Enforced pending evidence.** `release-state` defaults to a public, no-index preview; sitemap exposure and indexing require explicit release approvals. Cloudflare Access is still not configured, so the unreviewed preview is technically public and must remain no-index until an owner either protects it or authorizes a reviewed launch.                               |
|   2 | Soft 404 responses                          | **Verified.** A real static `404.html` is generated; unknown routes are tested as not-found instead of returning the homepage.                                                                                                                                                                                                                                                |
|   3 | Missing privacy policy                      | **Enforced pending evidence.** `/privacy/` permanently redirects to `/privacy-policy/`. The owner-supplied legal operator and mailing address are recorded, while the privacy-notice model still refuses public policy publication without an approved privacy contact, processor/retention, rights, effective-date, and approval facts. No placeholder policy was published. |
|   4 | Missing food/safety human gates             | **Enforced pending evidence.** Publication requires named test-cook, food-safety, Korean-language, and editorial gates. All current recipes remain draft and are excluded from indexable surfaces, recipe schema, and the sitemap.                                                                                                                                            |
|   5 | Incorrect sitemap endpoint                  | **Verified.** Standard `/sitemap.xml` is generated as XML, only from publishable canonical recipes; the preview output correctly contains no claimed public URLs.                                                                                                                                                                                                             |
|  10 | No accountable recipe contributors or dates | **Enforced pending evidence.** Recipe accountability UI and schema fields require real linked profiles, credentials, review dates, and a material-update date. No names or credentials were invented.                                                                                                                                                                         |

### P1

|   # | Finding                                 | Remediation and current status                                                                                                                                                                                                                            |
| --: | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   6 | Meaningless sitemap `lastmod`           | **Enforced pending evidence.** Only a real reviewed/material update date can emit a `lastmod`; no build-time date substitution is allowed.                                                                                                                |
|   7 | Ineligible Recipe JSON-LD               | **Enforced pending evidence.** Recipe schema is withheld for drafts. Once publishable, it requires governed metadata and a sealed, reviewed 1:1/4:3/16:9 image set; unlicensed or arbitrary URLs are rejected.                                            |
|   8 | Weak recipe social cards                | **Enforced pending evidence.** Article/social-image metadata is emitted only for a publishable recipe with an approved social asset. Draft pages do not make false share-preview claims.                                                                  |
|   9 | Missing publisher/website entity schema | **Enforced pending evidence.** Publisher graph rendering is gated on approved privacy/operator identity; it remains withheld until those facts exist.                                                                                                     |
|  11 | Missing trust/governance routes         | **Verified as routes; pending factual approval.** About, contact, privacy, terms, accessibility, editorial, recipe-testing, and corrections routes are present and fail closed with no-index treatment when their required factual content is unresolved. |
|  12 | Missing HSTS                            | **Partially verified.** A one-year host-only HSTS policy is deployed by source. `includeSubDomains` is intentionally deferred until every delegated hostname is inventoried and confirmed HTTPS-capable.                                                  |
|  14 | Analytics/NEL not disclosed             | **Enforced pending evidence.** The privacy configuration models Cloudflare analytics/network-reporting disclosure and blocks a public notice until factual retention/controller details receive approval.                                                 |
|  20 | No commercial activation gate           | **Verified.** Commercial modules remain disabled unless contract, disclosure, privacy, sponsored-link, consent, accessibility, price/availability, and operational evidence all pass a build-time gate.                                                   |
|  21 | No affiliate disclosure policy          | **Verified.** Affiliate activation and disclosure are coupled; a disclosure cannot claim an active relationship when every commercial module is disabled.                                                                                                 |
|  22 | Insufficient publication QA             | **Verified.** Release-only evidence validation checks public SEO uniqueness, dates, media rights, time arithmetic, allergens, related/menu references, and warns on content-evidence limitations and similarity.                                          |
|  23 | No search-operations discipline         | **Enforced pending evidence.** The search runbook/log requires verified properties, inspection/submission timestamps, weekly checks, and first-index evidence before a 30-day completion claim. No Google/Bing launch activity has been fabricated.       |
|  24 | No newsletter operating specification   | **Verified.** Newsletter collection remains off and can activate only with an approved provider, double opt-in (or an approved exception rationale), retention/suppression controls, and legal approval.                                                  |

### P2

|   # | Finding                                | Remediation and current status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --: | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  13 | Overly broad CORS                      | **Verified in source/build.** Cloudflare Pages’ default `Access-Control-Allow-Origin` is detached globally and is not re-added because no asset has a documented cross-origin consumer. Final live headers are rechecked after deployment.                                                                                                                                                                                                                                                                                                              |
|  15 | HTML not visibly edge-cached           | **External operation pending.** Root and trailing-slash HTML now declare `public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400`; immutable Astro assets retain their separate one-year rule. `docs/EDGE-CACHE-ROLLOUT.md` specifies the canonical-host Cache Rule, failed-response (`>=400`) no-store Cache Response Rule, purge, and evidence steps. The deployed credentials do not have Cache Rules authority, so a live cache-hit claim is not made.                                                                     |
|  16 | No explicit performance/CWV gate       | **Verified.** The build evaluates a policy with hard ceilings and a ≤10% regression rule plus expiring, metric-scoped signed exceptions. Latest emitted-artifact measurements: HTML gzip **10,767 B**, shared CSS raw **34,423 B**, first-party JS gzip **5,296 B**, third-party JS **0 B**, mobile hero **33,533 B**, desktop hero **104,381 B**. The route-level image contract caps mobile candidates at 600px even for high-DPR devices. Field CWV ownership and review cadence are documented; lab/build results are not mislabeled as field data. |
|  17 | Light-only theme                       | **Verified.** The site follows `prefers-color-scheme` using semantic surface/text/border tokens, light/dark browser theme-color metadata, and no preference storage or client script. Food imagery is not inverted.                                                                                                                                                                                                                                                                                                                                     |
|  18 | Cosmetic, non-installable PWA manifest | **Intentional policy decision.** The manifest link and route were removed. The product is now explicitly a high-quality responsive web utility without a service worker or stale offline cache for safety-sensitive content.                                                                                                                                                                                                                                                                                                                            |
|  19 | Incomplete icon coverage               | **Verified.** The existing SVG favicon is retained, with first-party 32×32 PNG and 180×180 Apple touch icons generated from the same mark and checked for PNG format/dimensions. Manifest-only 192/512/maskable icons are intentionally not shipped because the site is not a PWA.                                                                                                                                                                                                                                                                      |

## Evidence and release controls

- Build policy: `data/performance-budget.json`, `scripts/performance-budget.mjs`, and `scripts/validate-built-preview.mjs`.
- Security/cache policy: `public/_headers`, `scripts/validate-security-headers.mjs`, and `docs/EDGE-CACHE-ROLLOUT.md`.
- P2 targeted verification: 36 performance/theme/security/phase checks passed during release review; P2 source review found no remaining code or CI blocker.
- The release pipeline also runs publication-evidence, commercial-activation, header, edge-tombstone, content-lint, and built-preview validation. GitHub Actions/Linux Pages build is the release authority because the local Windows Astro native compiler is restricted by application control.

## Remaining accountable actions before an indexed content launch

1. Choose and configure a real preview-access policy (Cloudflare Access or equivalent), or explicitly authorize a reviewed public launch.
2. Supply and approve the privacy contact, processor/retention and deletion process, confirmed analytics/logging disclosures, rights-request method, effective date, and accountable legal approval.
3. Complete and record all four human gates, named contributor profiles, dates, credentials, and approved editorial media for each recipe before publication.
4. Inventory every subdomain before adding HSTS `includeSubDomains`.
5. Grant Cloudflare Cache Rules/Cache Response Rules and Cache Purge authority, apply the documented canonical-host rules, purge, and capture live cache behavior.
6. Verify Search Console and Bing Webmaster Tools, then complete the documented inspection/submission and 30-day monitoring record before making an indexing-success claim.

## Deployment record

The PR and production verification comment record the immutable commit, Pages deployment, exact route/header checks, and any external configuration that remains outstanding. This document deliberately distinguishes a successful technical deployment from the separate governance approval required to index or monetize the content.
