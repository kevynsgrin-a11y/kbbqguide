# Information Architecture

## Route families

The complete locked Phase 1 route list lives in `data/url-registry.json`; the CSV is a human-review view. Primary families are home/start, recipes and six categories, guides and twelve guide slugs, menus, shop, videos, company/contact/newsletter, and eight policy/preference pages.

Recipe routes are reserved for Phase 2 as `/recipes/{category-slug}/{recipe-slug}/`. Each route will be registered by immutable recipe ID before a page is generated.

## Reusable page contracts

| Template       | Data source                      | Structured data                         | Primary interaction                    |
| -------------- | -------------------------------- | --------------------------------------- | -------------------------------------- |
| Marketing/home | Page record                      | WebSite/Organization only when complete | Start or build a menu                  |
| Recipe         | Recipe collection                | Recipe + visible BreadcrumbList         | Scale, print, cook safely              |
| Category       | URL registry + recipe collection | ItemList + breadcrumb                   | Filter and choose                      |
| Guide          | Guide record                     | Article only when complete              | Learn and continue to relevant tool    |
| Menu           | Menu graph                       | ItemList when visible                   | Choose 2/4/8, generate list            |
| Shop           | Approved merchant registry       | None by default                         | Compare disclosed recommendations      |
| Policy         | Versioned policy content         | None                                    | Understand terms or update preferences |

## Navigation model

Global header: logo/home, Start Here, Recipes, Guides, Menus, Shop, search trigger, newsletter CTA. Mobile navigation uses one labeled button, focus containment, Escape close, focus return, and no hover dependency. Footer includes company, policy, disclosure, accessibility, contact, and preference links.

## Content relationships

Internal links are ID-based and purposeful: menu compatibility, technique, protein, dietary/allergen display, and preparation sequence. Recipe pairings must be reciprocal or intentionally marked directional. Random related-content links are prohibited.

## Tools

Servings and marinade scaler, 2/4/8 menu builder, consolidated shopping list, prep timeline, equipment checklist, and a non-medical allergen filter progressively enhance server-rendered content. All calculations use structured data; the allergen filter must state that labels and cross-contact still require checking.
