# URL and Link Policy

1. `data/url-registry.json` is the machine source of truth. `docs/url-registry.csv` is a review export.
2. Every item has an immutable ID separate from display title and slug.
3. Slugs are lowercase ASCII kebab-case. Normalization removes query strings, fragments, controls, punctuation, and diacritics; empty, reserved, traversal, extension-like, or colliding results fail validation.
4. Every internal path begins and ends with `/`; the homepage is `/`. Double slashes and `..` are invalid.
5. Code resolves internal paths by immutable ID through `registryPathById`. Free-text path concatenation is prohibited.
6. Every indexable page has one self-referencing canonical using `https://kbbqguide.com` until the production domain is supplied.
7. A locked slug change requires a redirect record from the old path to the immutable ID. Silent rename or deletion is prohibited.
8. Outbound links use HTTPS and an exact-host allowlist. `javascript:`, `data:`, `vbscript:`, `file:`, protocol-relative, malformed, or unregistered destinations fail the production build.
9. Affiliate links are inactive until merchant status, terms date, affiliate ID, domains, allowed parameters, disclosure ownership, commercial activation gates, and channel permissions are human approved. Paid links are visibly disclosed and receive `rel="sponsored nofollow"`.
10. Owned campaign links use readable `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`. Merchant URLs use only program-approved parameters or sub-ID fields.

Production gates: zero duplicate IDs, paths, or canonicals; zero broken internal links; zero unsafe protocols; zero unregistered active affiliate links.
