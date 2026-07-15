# Phase 6 Revenue, Audience, and Measurement Handoff

Checkpoint date: 2026-07-14

## Outcome

Phase 6 expands the non-production static preview from 108 to 116 HTML pages. The eight new routes cover Shop, Newsletter, Affiliate Disclosure, Sponsored Content Policy, Live Class, Media Kit, Licensing Inquiry, and Brand Partnerships. Four new registry IDs activate previously reserved Phase 6 paths while preserving every earlier locked ID and path.

The commercial and audience architecture is deliberately inert. The build contains zero active affiliate links, zero approved merchants, zero allowed outbound domains, zero active revenue modules, zero active ads, zero enabled forms, no analytics provider, and no data collection. Robots still disallows the complete preview, and all HTML remains `noindex,nofollow,noarchive` with `.invalid` preview canonicals.

## Affiliate and revenue controls

The affiliate registry contains nine pending merchant candidates. Every record is `not-applied`, has no affiliate ID or accepted terms, and has an empty approved-domain list. The safe link builder requires an active record, exact approved HTTPS destination host, clean destination URL, approved parameter names and values, and a registry-controlled affiliate ID. It rejects credentials, ports, query/fragment smuggling, caller-supplied affiliate IDs, and unapproved parameters.

Seven recommendation modules and four ad-slot reservations are disabled. Shop shows an inactive material-connection disclosure and no external merchant link, price, inventory, coupon, ranking, review, or firsthand-testing claim. Digital products, a class, sponsorship, licensing, and partnership pages are planning interfaces rather than offers. Their forms have no action and all controls are disabled.

## Audience and measurement planning

The 90-day calendar uses `America/Los_Angeles`, covers 13 weeks, and schedules 52 distinct remaining recipe drafts. Every entry is a planned draft and requires editorial plus channel approval before release. The atomization template keeps safety, source, cultural, platform, and claim checks attached to derivative content.

The provider-neutral automation map defines 11 explicit interest tags, five welcome-sequence drafts, and four keyword-based direct-message drafts. Direct-message interaction never substitutes for email consent. SMS is disabled for at least the first 30 days and requires a separate legal and consent gate.

The analytics plan defines 18 event contracts without installing a provider or collecting events. It prohibits direct identifiers and sensitive free text and documents event-specific parameters, purpose, consent category, and retention gates. Provider setup remains an approval checklist, not a configured integration.

## Verification

Run:

```bash
npm run validate:phase6
npm run build
npm run check
npm run audit
```

The full suite passes 106 of 106 tests. The Phase 6 gate passes 94 of 94 tests. The production-mode static build emits and crawls 116 HTML pages with 116 unique titles, canonicals, and sitemap URLs; 4,064 internal links resolve, and the crawl finds zero outbound anchors or third-party scripts.

Representative browser QA passed 12 of 12 desktop/mobile route checks plus mobile Escape/focus return, no-JavaScript collection safeguards, and print disclosure behavior. Four full-page captures were visually inspected. See `docs/PHASE-6-BROWSER-QA.md`.

## Human review still required

Merchant applications, program terms, domains, channel permissions, product evidence, disclosures, advertisements, sponsorships, prices, taxes, checkout, refunds, delivery, legal identity, consent language, privacy terms, retention, deletion, analytics configuration, email/messaging providers, and production destinations all require explicit review and configuration. Manual screen-reader, zoom, physical-device, real-media, test-kitchen, cultural, food-safety, legal, privacy, and security reviews remain unresolved as applicable.

No provider was installed, no external destination was added, no value can be submitted, no remote write occurred, and no production publishing or deployment is authorized by this checkpoint.

## Next action

Phase 7 may perform the full QA and hardening pass: automated tests, crawl, viewport, keyboard, screen-reader-landmark, print, reduced-motion, no-JavaScript, security-header, privacy, and performance review. Repair critical and high defects, repeat validation, and preserve every content, safety, media, commercial, consent, no-index, and human-approval gate. Do not publish or deploy.
