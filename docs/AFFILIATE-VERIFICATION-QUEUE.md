# Affiliate-Program Verification Queue

Queue owner: unassigned  
Queue status: open  
Registry authority: `data/affiliate-registry.json`  
Checkpoint date: 2026-07-14

All nine records are `not-applied`. No program is represented as available, approved, or active. Verify current terms from the program's official source at the time of application; program names, networks, eligibility, and permissions can change.

| Registry ID            | Program route to verify               | Required human action                                                                                               | Status      |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| `amazon-associates`    | Direct Amazon program                 | Confirm market eligibility, application, disclosure, link, API, price, email, and social rules                      | Not applied |
| `weee-affiliate`       | Direct/in-house Weee route            | Confirm current official application route, eligible channels, disclosure, attribution, and domain rules            | Not applied |
| `walmart-creator`      | Direct Walmart platform               | Confirm creator eligibility, site approval, permitted channels, disclosure, price, and API terms                    | Not applied |
| `thermoworks-impact`   | Impact                                | Confirm advertiser availability, Impact contract, deep-link domains/parameters, and channel permissions             | Not applied |
| `bbqguys-impact`       | Impact                                | Confirm advertiser availability, Impact contract, deep-link domains/parameters, and channel permissions             | Not applied |
| `ooni-awin`            | Awin                                  | Confirm advertiser availability, Awin contract, deeplink rules, markets, and channel permissions                    | Not applied |
| `ebay-partner-network` | Direct eBay programs                  | Confirm which official program fits the property, approved domains, link tools, and channel terms                   | Not applied |
| `etsy-affiliate`       | Official Etsy application route       | Confirm contracting platform, country eligibility, creator versus publisher route, and content/channel restrictions | Not applied |
| `home-depot-affiliate` | Official Home Depot application route | Confirm current network, approved property, product/link rules, and channel permissions                             | Not applied |

## Evidence required per merchant

Record application and approval status, the exact terms URL/version and verification date, account/property ID location, approved domains, allowed parameter names, approved link builder, ID parameter, geographic scope, email/social/price/API permissions, disclosure wording, prohibited practices, payout/tax owner, monitoring owner, and re-verification date. Store secrets outside the repository.

## Activation gate

A merchant may move toward activation only after human approval and an intentional update to the registry. Then independently review the deny-by-default outbound allowlist, affiliate-link builder, disclosure placement, channel permissions, CSP/privacy impact, tests, and release authorization. Partial approval does not authorize links. Phase 8 leaves all merchants inactive and all outbound domains denied.
