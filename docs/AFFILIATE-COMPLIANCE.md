# Affiliate Compliance and Activation Gate

Checkpoint date: 2026-07-14

## Current state

All nine seed merchants are `not-applied`. Every terms date, affiliate ID, approved domain, parameter list, affiliate builder, and channel permission is empty or unknown. The outbound-domain allowlist is empty. The UI renders merchant names only as pending candidates and emits no merchant destination, paid link, price, availability, discount, stock, coupon, rating, ranking, or product-testing claim.

## Activation requirements

A compliance owner must complete and approve each field for one merchant before its link can be built:

1. Confirm the contracting entity, program, network, and official enrollment path.
2. Record the application and approval state using real account evidence.
3. Verify current terms and record the verification date.
4. Record the real affiliate ID in server-side configuration, never in a public planning document.
5. Record exact approved HTTPS destination hostnames and parameter names.
6. Select and test the merchant-specific builder; never concatenate query strings.
7. Verify email, social, price-display, API, deep-link, PDF, messaging, and sub-ID permissions separately.
8. Approve the adjacent disclosure text and sponsored-link attributes.
9. Test fallback behavior for unavailable or disallowed destinations.
10. Re-run protocol, hostname, credential, port, query, fragment, parameter, disclosure, and crawl tests.

No merchant may move to `approved` while a required field is null, empty, unknown, or unsupported by evidence.

## Placement and disclosure

- State the material connection before or adjacent to the first recommendation; do not rely on a footer alone.
- Mark paid links `rel="sponsored"` when they eventually exist.
- Identify sponsored content clearly at the top and near paid recommendations.
- Keep editorial criteria and sponsorship separate; payment cannot determine an undisclosed ranking.
- Never claim firsthand testing without a dated test log for the exact item.
- Show a price or “price checked” date only when the program permits it and a real check is recorded.
- When a channel prohibits direct affiliate links, link to an on-site disclosed guide only if that guide and route are approved.

## Builder boundary

`src/lib/affiliate-links.ts` rejects inactive records, invalid URLs, non-HTTPS protocols, credentials, ports, preexisting query strings or fragments, unapproved hostnames, unapproved parameters, attempts to override the affiliate-ID parameter, and empty/control-character parameter values. The registry—not the caller—supplies the affiliate ID.

## Review cadence

Reverify terms at enrollment, before first use in each channel, after any program notice, and at the scheduled compliance review. Suspend links immediately when terms, account status, product claims, permissions, or destination integrity are uncertain.
