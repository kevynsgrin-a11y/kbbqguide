# Unresolved Human-Review Queue

Queue owner: unassigned  
Queue status: open  
Checkpoint date: 2026-07-14

No human approval is inferred. **80 of 80 recipe drafts** still require all four recipe gates: test-kitchen, food-safety, Korean-language, and cultural/editorial review. The site-level release gates below are also open.

| ID     | Priority | Review and evidence required                                                                                                                        | Scope                                             | Exit evidence                                                                          | Status |
| ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- | ------ |
| HR-001 | P0       | Replace and independently verify brand, legal name, author, contact, domain, canonical, provider, and mailing-address placeholders                  | Repository and rendered site                      | Zero unresolved placeholders; owner and date recorded                                  | Open   |
| HR-002 | P0       | Execute the documented recipe exactly; record weights, timing, yield, texture, doneness, failure modes, and corrections                             | 80 recipes                                        | Signed test-kitchen log per recipe; `testCookStatus` approved                          | Open   |
| HR-003 | P0       | Review temperatures, cross-contamination controls, seafood handling, fermentation/storage, reheating, allergens, and vulnerable-population language | 80 recipes and safety standards                   | Qualified reviewer, date, findings, corrections; `foodSafetyReview` approved           | Open   |
| HR-004 | P0       | Review Hangul, Korean names, romanization, pronunciation, and meaning                                                                               | 80 recipes plus navigation copy                   | Named Korean-language reviewer and signed corrections; `koreanLanguageReview` approved | Open   |
| HR-005 | P0       | Review cultural context, adaptation labels, claims, serving context, and avoidance of universalizing language                                       | 80 recipes, 12 guides, menus, homepage            | Named reviewer, dated decision log, corrections closed                                 | Open   |
| HR-006 | P0       | Final editorial, sourcing, allergen, SEO, author/reviewer, and legal-claims pass                                                                    | All public copy and structured data               | Editorial approval recorded; approved cohort selected                                  | Open   |
| HR-007 | P0       | Produce and approve rights-cleared, accurate, accessible media                                                                                      | 80 media plans                                    | Rights, subject, crop, alt, caption, transcript, and visual-safety QA complete         | Open   |
| HR-008 | P0       | Manual assistive-technology, 200%/400% zoom, high-contrast, touch, and physical-device review                                                       | Release candidate on real devices                 | Browser/device matrix and issues closed or accepted by owner                           | Open   |
| HR-009 | P0       | Legal, privacy, consent, accessibility statement, email/SMS, analytics, and retention review before any provider activation                         | Policies and provider setup                       | Counsel/owner approval; consent and deletion behavior tested                           | Open   |
| HR-010 | P0       | Final-domain validation of HTTPS, headers, CSP, canonical URLs, robots, sitemaps, feeds, redirects, and indexability                                | Authorized preview and production candidates      | Signed launch checklist with captured responses                                        | Open   |
| HR-011 | P1       | Verify every proposed commercial program and disclosure/channel rule                                                                                | Nine merchant records and all commercial surfaces | Affiliate queue complete; registry and allowlist intentionally updated                 | Open   |
| HR-012 | P0       | Final release decision and rollback-owner assignment                                                                                                | Whole release candidate                           | Named approver, immutable candidate ID/hash, time window, rollback target              | Open   |

## Working rule

Resolve each row with a named owner, completion date, evidence link or artifact, findings, correction commit/candidate, and explicit approve/reject decision. “Reviewed” without evidence is not an approval. A rejected or materially changed item returns all affected downstream checks to open.
