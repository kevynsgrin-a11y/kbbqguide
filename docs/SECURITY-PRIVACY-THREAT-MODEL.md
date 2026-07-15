# Security and Privacy Threat Model

## Protected assets

Editorial integrity, user trust, consent/preferences, contact/newsletter data, provider tokens, URL/canonical integrity, affiliate attribution, and build/deployment credentials.

## Trust boundaries

Static browser content; build-time content pipeline; future server-side form endpoints; email/social/analytics providers; merchants; hosting/CDN; human editorial approval. Generated content is untrusted until schema and human approval pass.

## Principal threats and controls

| Threat                                 | Control                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Script/HTML injection from content     | Typed fields only, escaped rendering, no arbitrary HTML, sanitization if rich text is later approved      |
| Exposed secret                         | Server-only environment variables, placeholder-only example, secret scan, no tokens in URLs/logs/frontend |
| Open redirect or unsafe affiliate URL  | No redirect endpoint by default; exact HTTPS host and parameter allowlists                                |
| CSRF/spam on future forms              | Same-origin validation, CSRF token where state changes, honeypot/rate limit, server validation            |
| Supply-chain compromise                | Exact versions, lockfile, audit, no remote runtime code/imports, reviewed updates                         |
| Overcollection/tracking before consent | Data minimization, defer marketing scripts, preference controls, documented retention                     |
| Personal data in analytics             | Event allowlist; reject emails, names, full IP-derived fields, and identifiers in events/URLs             |
| Unauthorized publish                   | Human approval gate and production environment validation                                                 |
| Canonical/link poisoning               | Immutable registry lookup, build-time crawl, canonical uniqueness checks                                  |
| Clickjacking/MIME/data leakage         | CSP, frame restrictions, `nosniff`, referrer and permissions policies at hosting layer                    |

## Planned headers

Start with `default-src 'self'`; tightly enumerate image/media/form/connect domains only after approval. Add `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, constrained `form-action`, `X-Content-Type-Options: nosniff`, strict referrer policy, least-privilege Permissions-Policy, and HSTS only after HTTPS production verification. CSP must be tested against every enabled integration rather than weakened broadly.

## Data lifecycle

Phase 1 collects no personal data. Before newsletter/contact launch, document purpose, fields, processor, consent basis, retention, access/deletion workflow, suppression-list handling, breach escalation, and exact preference behavior. Never place personal identifiers in analytics or campaign URLs.
