# Design System and Component Contracts

## Direction

Premium warm tabletop dining: charcoal-gray backgrounds, soft cream reading surfaces, brushed-metal neutrals, ceramic whites, fresh leafy greens, and restrained pepper-red accents. It must feel editorial and hospitable without copying another brand's trade dress.

## Locked tokens

| Token                  | Value                                    | Use                          |
| ---------------------- | ---------------------------------------- | ---------------------------- |
| `--color-charcoal-950` | `#171916`                                | Deep canvas                  |
| `--color-charcoal-800` | `#2b2d28`                                | Cards/navigation             |
| `--color-cream-50`     | `#fffaf0`                                | Reading surface              |
| `--color-cream-100`    | `#f7f2e8`                                | Light text/surface           |
| `--color-metal-500`    | `#777b72`                                | Secondary detail             |
| `--color-leaf-700`     | `#35613d`                                | Positive/action accent       |
| `--color-pepper-600`   | `#b4382f`                                | Restrained CTA/safety edge   |
| `--color-warning-700`  | `#8a381f`                                | Warning border/text on light |
| `--radius-sm/md/lg`    | `0.5/1/1.5rem`                           | Controls/cards/heroes        |
| `--space-1..8`         | `0.25rem` geometric scale through `4rem` | Layout rhythm                |
| `--content-reading`    | `42rem`                                  | Recipe prose                 |
| `--content-wide`       | `76rem`                                  | Global layout                |

Body copy uses a local system sans stack; display headings use a system serif fallback until brand font licensing and performance are approved. Minimum body size is 1rem with a 1.6 line height.

## Shared contracts

Global: `Header`, `MobileNav`, `Footer`, `Breadcrumbs`, `DisclosureBox`, `SafetyCallout`, `RecipeControls`, `RelatedContent`, `AffiliateModule`, reserved `AdSlot`, `NewsletterForm`, and accessible `VideoPlayer`.

Hero variants—marketing, recipe, guide, category—share: eyebrow, H1, support text, breadcrumb, primary/optional secondary CTA, media ID, focal point, overlay, mobile crop, intrinsic dimensions, priority, alt text, provenance/credit, optional badges, and reduced-motion behavior.

Recipe controls must be fully labeled, keyboard operable, printable, and useful without JavaScript. Safety callouts cannot collapse. Ad slots reserve dimensions and are disabled by default.

## Motion and media

Use subtle CSS depth, hover tilt, parallax, and view transitions only as progressive enhancement. Disable nonessential motion for reduced-motion, keyboard, coarse-pointer, low-power, or no-JavaScript conditions. No decorative WebGL dependency enters the critical path.

Media contracts require manifest ID, aspect ratio, intrinsic dimensions, focal point, alt/caption, provenance, rights status, and QA status. A placeholder is visibly a placeholder; it never masquerades as a finished dish.
