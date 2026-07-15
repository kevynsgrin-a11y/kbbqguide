# Phase 0 Risk Register

| Risk                                                     | Likelihood | Impact   | Control                                                                           | Owner / gate                        |
| -------------------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| Unreviewed food-safety instruction reaches production    | Medium     | Critical | Required schema status, publish rejection, adjacent safety callouts, human review | Food-safety reviewer before publish |
| Charcoal or outdoor fuel appliance appears safe indoors  | Low        | Critical | Explicit prohibited-language tests and guide standard                             | Editorial + QA                      |
| Cultural or Korean-language error                        | Medium     | High     | No unsupported origin claim; language review required                             | Qualified Korean-language reviewer  |
| Recipe claimed as tested without a log                   | Medium     | High     | Default required status and test-log evidence                                     | Test-kitchen lead                   |
| URL collision or changed slug breaks traffic             | Medium     | High     | Immutable ID, central registry, redirect manifest                                 | Technical QA                        |
| Fabricated affiliate link, price, or stock claim         | Medium     | High     | Empty allowlist, inactive seed records, approved builder only                     | Affiliate compliance reviewer       |
| Consent or personal data misuse                          | Medium     | High     | Data minimization, no identifiers in analytics, provider-side secrets             | Privacy reviewer                    |
| Media rights or subject mismatch                         | Medium     | High     | Placeholder status, provenance fields, visual QA                                  | Media lead                          |
| Excess client JavaScript harms performance/accessibility | Medium     | Medium   | Static HTML baseline and per-template budgets                                     | Performance QA                      |
| Framework/dependency vulnerability                       | Low        | High     | Exact lockfile, audit, no remote runtime imports                                  | Security reviewer                   |
| Placeholder accidentally deployed                        | Medium     | High     | Production gate rejects braces and missing required environment values            | Release QA                          |
| Scope expansion causes non-deterministic mass generation | High       | Medium   | Phase boundaries; no more than 10 complete recipes per Phase 3 batch              | Project lead                        |

Phase 0 found no inherited code, secrets, remote repository, deployment, or user changes to preserve.
