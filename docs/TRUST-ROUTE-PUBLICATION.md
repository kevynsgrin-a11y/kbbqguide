# Trust-route publication protocol

KBBQGuide exposes stable URLs for its trust and governance routes without
filling them with invented legal or contact facts. The source of truth is
`data/trust-route-config.json`, plus `data/privacy-notice.json` for the
privacy policy. A blocked legal-dependent route renders a transparent,
non-collecting status page and has explicit `noindex,nofollow,noarchive` page
metadata.

## Routes that are complete as operational standards

- `/about/`
- `/editorial-policy/`
- `/recipe-testing-policy/`

## Required factual inputs before public policy publication

| Route              | Required approved facts                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/contact/`        | Public email, inquiry-data retention statement, approver, approval date                                                                                             |
| `/privacy-policy/` | Legal operator, privacy email, postal address, effective date, hosting/analytics processors and retention, cookie statement, rights method, approver, approval date |
| `/terms/`          | Legal operator, public email, effective date, governing law, complete approved terms text, approver, approval date                                                  |
| `/accessibility/`  | Feedback email, last-reviewed date, approver, approval date                                                                                                         |
| `/corrections/`    | Corrections email, accountable process owner, approver, approval date                                                                                               |

Do not substitute a placeholder contact, an example domain, a generic
retention period, a guessed jurisdiction, or a fabricated legal entity. When
the owner supplies a fact, record it only with its accountable approval and
rerun the trust-route tests before changing the page out of its blocked state.
