# Phase 6 Browser QA

Checkpoint date: 2026-07-14

## Automated browser matrix

Headless Chromium checked six representative Phase 6 routes at 1440×900 and 390×844, for 12 viewport-route checks:

- Shop;
- newsletter;
- affiliate disclosure;
- live class;
- media kit;
- brand partnerships.

All 12 passed. Each returned a successful response, rendered meaningful content with exactly one H1 and main landmark, emitted one preview canonical and the required robots directive, showed no framework error overlay or browser console/page error, and produced no horizontal overflow. No checked page contained an external HTTP(S) anchor or iframe.

The Shop rendered seven disabled revenue modules, one disabled ad reservation, and the inactive affiliate disclosure. Every checked collection interface exposed its disabled status, omitted a form action, and kept every input, textarea, and button disabled.

## Keyboard, no-JavaScript, and print checks

- Mobile navigation on Shop closed on Escape and returned focus to its disclosure control.
- With JavaScript disabled, the Newsletter retained meaningful content, an explicit collection-disabled marker, disabled controls, no form action, and the statement that values are not submitted, stored, or sent.
- In print emulation, site navigation and the disabled form were hidden while the consent disclosure remained visible.

## Visual inspection

Four full-page captures were inspected:

- Shop at desktop width;
- Newsletter at mobile width;
- Affiliate Disclosure at desktop width;
- Brand Partnerships at mobile width.

The typography, disclosure emphasis, disabled-state language, card grids, form labels, mobile stacking, and footer remained coherent. No clipped content, illegible overlap, accidental active control, external destination, unsupported product claim, or layout break was observed.

## Remaining manual gates

Named human review is still required with real assistive technology, at 200% and 400% zoom, on representative physical devices, and after final brand, legal, merchant, provider, privacy, consent, and production-domain configuration. Automated Chromium checks do not approve an affiliate program, recommendation, advertisement, sponsorship, mailing workflow, analytics provider, legal disclosure, or data collection.
