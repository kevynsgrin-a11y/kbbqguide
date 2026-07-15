# Analytics Event Plan

Checkpoint date: 2026-07-14

Collection is disabled and no provider is configured. `data/analytics-event-registry.json` is the machine allowlist for 18 planned events.

## Principles

- Collect only fields needed to answer a documented product or business question.
- Require the appropriate analytics or marketing consent before an event adapter runs.
- Never send email, name, phone, street address, full IP-derived data, user ID, free text, raw query strings, recipe notes, or provider tokens.
- Use immutable content/module IDs and coarse numeric buckets instead of user-entered values.
- Do not put personal identifiers in URLs, campaign parameters, logs, or event payloads.
- Keep analytics outcomes separate from editorial, safety, and cultural approval.

## Event groups

- Reading: `recipe_view`, `recipe_complete`, `jump_to_recipe`, `print_recipe`.
- Planning: `servings_scaled`, `menu_built`, `shopping_list_created`.
- Media: `video_start`, `video_50`, `video_complete` only after real approved video exists.
- Email: `email_signup`, `welcome_sequence_complete` only after consent/provider activation.
- Revenue: `affiliate_click`, `bundle_view`, `digital_product_view`, `digital_purchase`, `class_waitlist_signup`, `class_purchase` only after the relevant feature is approved.

## Activation gate

Select a provider; document data processing, consent, retention, deletion, IP handling, regional behavior, and access controls; implement an event-schema validator; test blocked consent and prohibited parameters; inspect browser/network requests; and obtain privacy/legal approval. The adapter must fail closed when consent, event name, or parameter name is not allowlisted.
