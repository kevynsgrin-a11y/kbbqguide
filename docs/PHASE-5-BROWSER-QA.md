# Phase 5 Browser QA

Checkpoint date: 2026-07-14

## Automated browser matrix

Headless Chromium checked six representative routes at 1440×900 and 390×844, for 12 viewport-route checks:

- home;
- guide index;
- indoor/outdoor safety guide;
- four-guest menu;
- planning tools;
- HTML sitemap.

All 12 passed. Each returned a successful response, rendered meaningful content with exactly one H1 and main landmark, emitted one preview canonical and the required robots directive, showed no framework error overlay or browser console/page error, and produced no horizontal overflow. The safety guide and menu kept their safety callouts visible. The tools route rendered all five grouped panels covering seven planning capabilities.

## Interaction checks

- Menu builder changed from four to eight guests and rendered 11 linked recipes plus 58 consolidated shopping lines.
- Prep runway changed to the two-hour sequence.
- Soy filtering reduced the allergen display from 80 to 24 draft recipes.
- Equipment checklist state changed locally.
- Servings calculation changed from 1,000 g for eight to 250 g for two.
- Mobile navigation closed on Escape and returned focus to its disclosure control.

## No-JavaScript and print checks

With JavaScript disabled, the tools page retained the default linked menu, more than ten shopping lines, all seven equipment checks, all 80 allergen-linked recipes, the non-medical limitation, and the server-rendered no-JavaScript explanation. In print emulation, site navigation and interactive calculator inputs were hidden while the allergen limitation remained visible.

## Visual inspection

Four full-page captures were inspected:

- guide index at desktop width;
- indoor/outdoor safety guide at mobile width;
- planning tools at desktop width;
- four-guest menu at mobile width.

The information hierarchy, card grids, safety emphasis, form labels, long-list wrapping, mobile stacking, and footer remained coherent. No clipped content, illegible overlap, unexpected media claim, or layout break was observed.

## Remaining manual gates

Named human review is still required with real assistive technology, at 200% and 400% zoom, on representative physical devices, with final brand typography, and after production media and domain configuration. Automated Chromium checks do not approve medical safety, allergen safety, appliance suitability, cultural framing, food safety, or the results of physical test cooking.
