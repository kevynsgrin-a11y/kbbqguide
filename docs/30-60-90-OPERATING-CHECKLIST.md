# 30/60/90-Day Operating Checklist

The clock starts on the first explicitly authorized public release, not on Phase 8 handoff. If release has not occurred, repeat pre-launch verification and keep all collection, commercial, provider, messaging, and indexing controls disabled. Assign an owner and evidence link to every checked item.

## Pre-launch day 0

- [ ] Close every P0 row in `docs/HUMAN-REVIEW-QUEUE.md`; select an approved release cohort.
- [ ] Close required media and affiliate rows for only the features included in the release.
- [ ] Verify the exact candidate checksum, full build, audit, preview QA, legal/consent state, final domain, and rollback target.
- [ ] Record explicit release and separate indexing authorizations; do not infer one from the other.
- [ ] Name incident, privacy, security, editorial, accessibility, food-safety, media-rights, and commercial owners.

## Days 1–30: stabilize and establish baselines

- [ ] Daily for week 1, then weekly: verify uptime, representative routes, HTTPS, headers/CSP, robots/sitemaps/canonicals, 404s, forms, consent, disclosures, media, and unexpected third-party traffic.
- [ ] Triage safety, privacy, security, accessibility, and factual reports within the agreed severity SLA; use the rollback runbook when warranted.
- [ ] Re-test the initial cohort on real mobile/desktop devices, keyboard, screen reader, zoom, no JavaScript, reduced motion, and print.
- [ ] Confirm media rights, expiry dates, captions/transcripts, and alt/caption quality for every live asset.
- [ ] Review search coverage only after separate indexing approval; correct technical exclusions without broadening release scope.
- [ ] If privacy-approved analytics exists, document a lawful baseline for visits, engaged recipe views, tool use, search landings, errors, and Web Vitals. **Do not infer consent** from site use or a deploy event.
- [ ] Audit affiliate links only for approved merchants: destination, parameters, disclosure, channel, price freshness, and broken-link behavior.
- [ ] Hold a day-30 review: incidents, corrections, accessibility findings, user questions, performance, editorial throughput, and go/no-go for further recipes.

## Days 31–60: improve the proven system

- [ ] Release follow-on recipes only after their individual test-kitchen, safety, language, cultural/editorial, media, and final release gates pass.
- [ ] Cluster user questions into evidence-backed editorial improvements; do not turn anecdotal requests into unreviewed safety claims.
- [ ] Review internal search/landing gaps, menu usefulness, scaling/tool errors, broken links, structured data, and performance regressions.
- [ ] Complete a second accessibility sampling pass and remediate issues with regression tests.
- [ ] Reconcile affiliate program status, terms changes, expired offers, reporting, disclosures, and payout/tax records; disable uncertain links.
- [ ] Review consent logs, retention/deletion operations, processor inventory, provider access, and incident contacts if any collection was approved.
- [ ] Audit content/media provenance and correction history; schedule rights renewals.
- [ ] Hold a day-60 review and approve, defer, or reject the next release band.

## Days 61–90: validate sustainability

- [ ] Complete a representative recook and safety re-review across all six categories, prioritizing high-risk seafood, meat, fermentation, storage, and reheating content.
- [ ] Run a full crawl, structured-data check, security-header/CSP review, dependency audit, performance budget check, and cross-device accessibility pass.
- [ ] Reverify all active merchant terms and all external destinations; remove unsupported claims, stale prices, or disallowed channel use.
- [ ] Review editorial correction rates, production capacity, media cost/rights load, accessibility debt, incident load, and support burden.
- [ ] Compare approved business metrics with guardrails for safety corrections, privacy complaints, accessibility defects, performance, and editorial quality. Do not optimize conversion at the expense of a guardrail.
- [ ] Archive the 90-day evidence pack: deployments, incidents, corrections, approvals, consent/provider audits, media rights, affiliate verification, and release decisions.
- [ ] Decide the next 90-day plan: continue, narrow, pause, or expand. Any expanded collection, monetization, automation, or publishing scope requires a new reviewed release candidate.
