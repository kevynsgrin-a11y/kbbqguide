# Disclosure Audit — Phase 10.3 (P1-8)

_Computed sizes and worst-case contrast measured headlessly (Chromium, 1440×900) against the built site. HEAD `98f5aef3d101594260906e6663cc17d54cab2112`. Pass = synthetic-content disclosure ≥ 13px and ≥ 4.5:1 worst-case contrast (panel composited over both white and black, so it holds over any image behind it)._

- Synthetic disclosure elements measured: **23**
- Failing (< 13px or < 4.5:1): **0**

## Synthetic-content disclosure / credit (P1-8 scope)

| Template                   | Selector                | Computed px | Worst-case contrast | Pass | Text (start)                                                                     |
| -------------------------- | ----------------------- | ----------- | ------------------- | ---- | -------------------------------------------------------------------------------- |
| Home hero                  | `.home-hero-disclosure` | 13px        | 12.61:1             | ✅   | AI-generated editorial visualization; people shown are synthetic. Synthetic imag |
| Home hero                  | `.media-credit`         | 14px        | 14.14:1             | ✅   | The table comes together through passing, wrapping, and sharing.Synthetic image  |
| Home hero                  | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Recipe detail              | `.media-credit`         | 14px        | 14.14:1             | ✅   | Classic Korean Pear Beef Bulgogi. AI-generated dish illustration.Synthetic image |
| Recipe detail              | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · OpenAI; supplied for KBBQGuide                                 |
| Category index             | `.media-credit`         | 14px        | 14.14:1             | ✅   | Grilled meat, paced in small batches for the shared table.Synthetic image · KBBQ |
| Category index             | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Recipe library index       | `.media-credit`         | 14px        | 14.14:1             | ✅   | Six sections, composed as one deliberate table.Synthetic image · KBBQGuide edito |
| Recipe library index       | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Guide detail               | `.media-credit`         | 14px        | 14.14:1             | ✅   | A visible cord path, stable surface, and directly aligned hood make the setup le |
| Guide detail               | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Guide index                | `.media-credit`         | 14px        | 14.14:1             | ✅   | Plan the room, table, work, and cleanup before service.Synthetic image · KBBQGui |
| Guide index                | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Menu detail                | `.media-credit`         | 14px        | 14.14:1             | ✅   | A balanced table and workload for four.Synthetic image · KBBQGuide editorial dir |
| Menu detail                | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Menu index                 | `.media-credit`         | 14px        | 14.14:1             | ✅   | A menu grows with appetite, capacity, and workload.Synthetic image · KBBQGuide e |
| Menu index                 | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Planning tools             | `.media-credit`         | 14px        | 14.14:1             | ✅   | Quantities and timing stay connected to the real table.Synthetic image · KBBQGui |
| Planning tools             | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Start here                 | `.media-credit`         | 14px        | 14.14:1             | ✅   | A welcoming place to begin planning the whole table.Synthetic image · KBBQGuide  |
| Start here                 | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |
| Policy (sponsored-content) | `.media-credit`         | 14px        | 14.14:1             | ✅   | KBBQGuide editorial policy artwork.Synthetic image · KBBQGuide editorial directi |
| Policy (sponsored-content) | `.media-credit small`   | 13px        | 11.96:1             | ✅   | Synthetic image · KBBQGuide editorial direction / OpenAI                         |

## Other on-page disclosures (reported for completeness; not P1-8-gated)

| Template       | Selector          | Computed px | Worst-case contrast | Text (start)                                                                     |
| -------------- | ----------------- | ----------- | ------------------- | -------------------------------------------------------------------------------- |
| Planning tools | `.disclosure-box` | 16px        | 9.2:1               | This display cannot guarantee that a recipe, ingredient, brand, kitchen, or serv |

## Method

- Every page containing synthetic media renders a scoped disclosure: recipe/category/guide/menu/system heroes render `.media-credit` (with a `small` credit line carrying "Synthetic image · …"); the home hero renders a dedicated `.home-hero-disclosure` (P1-8 fix — previously the only nearby credit was on a later banner).
- Sizes are `getComputedStyle().fontSize` in CSS px, not read from source. Contrast is WCAG 2.x; translucent panels are composited over both white and black and the lower ratio is reported, so a pass holds over any image behind the panel.
- True contrast over the live production image at every breakpoint remains an operator manual gate (see `docs/PHASE-10-BROWSER-QA.md`), but the panel backgrounds here are opaque enough that the worst-case bound already clears 4.5:1.
