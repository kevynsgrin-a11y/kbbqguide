# Phase 7 Browser, Accessibility, Security, and Performance QA

Checkpoint date: 2026-07-14

## Repair loop

The first browser pass found two high-severity accessibility defects: the eight-guest planning list overflowed at 320 CSS pixels, and the Tools shopping-list scroll region could not receive keyboard focus in Safari. Both were repaired. The complete matrix was repeated from the beginning and passed.

See `docs/PHASE-7-DEFECT-LOG.md` for the five Phase 7 findings and their resolution evidence.

## Responsive and structural matrix

Headless Chromium checked ten representative routes at four viewport sizes—320×568, 390×844, 768×1024, and 1440×900—for 40 viewport-route checks:

- home;
- recipe index;
- one meat recipe;
- one seafood recipe;
- indoor/outdoor safety guide;
- eight-guest menu;
- planning tools;
- Shop;
- Newsletter;
- HTML sitemap.

All 40 passed. Each returned a successful response, rendered meaningful content with exactly one H1 and main landmark, exposed the required preview canonical and robots directive, showed no duplicate ID, skipped heading level, empty link, missing image alt, framework overlay, console/page error, iframe, outbound anchor, or horizontal overflow, and loaded only same-origin resources.

The 320 and 390 widths plus the 768 width exercise the practical reflow equivalents of 400% and 200% zoom on a 1280–1536 CSS-pixel desktop viewport. Named human zoom review is still required before production.

## Accessibility rules and assistive structure

Twenty axe-core WCAG 2.0 A/AA, WCAG 2.1 AA, and WCAG 2.2 AA runs covered every representative route at mobile and desktop widths. The final pass found zero critical, serious, moderate, or minor violations.

The Chromium accessibility tree exposed a banner, main, content information, and four named navigation landmarks on the representative recipe. The footer policy group is now a real named navigation landmark. This validates programmatic structure but is not a substitute for a named human pass with NVDA, JAWS, VoiceOver, or TalkBack.

## Keyboard and interaction

- The first Tab target was the visible skip link, and Enter moved focus to main content.
- Native mobile navigation opened by keyboard, closed on Escape, and returned focus to its summary control.
- Thirty-five consecutive focus targets were traversed without reaching a hidden or zero-size element.
- The constrained shopping list is now a named, focusable list region for keyboard scrolling.
- The eight-guest planner update rendered 11 recipe links and 58 shopping lines in 13.2 ms locally.
- Five polite live regions remained available for calculator and planner updates without focus theft.

## No-JavaScript, print, and reduced motion

With JavaScript disabled:

- the representative recipe retained 11 ingredient rows, six instruction steps, and its visible food-safety section;
- all five Tools panels and their server-rendered fallbacks remained available;
- Newsletter retained the collection-disabled explanation, no action, and zero enabled controls;
- all three pages reflowed at 320 CSS pixels without horizontal overflow.

In print emulation, navigation, footer, and recipe controls were hidden while ingredients, instructions, and food-safety content remained visible. With reduced motion requested, transforms were removed and animation/transition duration collapsed to 0.01 ms with one iteration.

## Live header and privacy behavior

Every matrix response carried the built Cloudflare Pages policy: CSP, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, Permissions-Policy, Referrer-Policy, `nosniff`, and legacy frame denial. The CSP allowed only same-origin resources, `data:` images, and the three exact executable module hashes; no unsafe script/style directive or third-party origin was present.

No page issued a third-party request, offered an active outbound destination, enabled a collection control, or exposed an iframe. Repository tests also found no client transmission, persistent storage, cookie, WebSocket, or production-secret primitive.

## Performance smoke

This is a local production-build smoke test, not field Core Web Vitals:

- maximum local load event: 37.9 ms;
- maximum observed LCP: 108 ms;
- maximum CLS: 0;
- interaction-delay proxy: 13.2 ms;
- compressed CSS: 4,987 bytes;
- external JavaScript: 0 bytes;
- maximum compressed inline JavaScript: 5,639 bytes.

The build validator separately measures maximum HTML and estimated initial compressed transfer so browser memory-cache behavior cannot hide a regression. There is no approved production media, font, advertising, analytics, or provider payload.

## Visual inspection

Six full-page captures were inspected: home at 320, the representative meat recipe at 320 and 1440, Tools at 768, Shop at 1440, and Newsletter at 390. The content hierarchy, disabled states, long-list wrapping, instruction cards, safety emphasis, tool forms, responsive stacking, and footer remained coherent. No clipping, overlap, accidental active state, or unsupported commercial/media claim was observed.

## Remaining manual gates

Named human review remains required with real assistive technology, 200%/400% browser zoom, representative physical devices, final fonts/media, and production hosting. The automated pass does not approve recipe accuracy, food safety, cultural framing, product suitability, legal disclosures, merchant terms, consent, privacy operations, or production deployment.
