# Phase 7 Defect Log

Checkpoint date: 2026-07-14

## Resolution summary

| ID       | Severity | Area                    | Finding                                                                                                                               | Status   | Repair and verification                                                                                                                                                                                               |
| -------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P7-H-001 | High     | Hosting security        | The Cloudflare Pages target had a documented header plan but emitted no `_headers` policy.                                            | Repaired | Added deny-by-default CSP, exact executable-script hashes, framing/MIME/referrer/capability isolation, and immutable hashed-asset caching. The build now fails if headers, hashes, or inline-style constraints drift. |
| P7-H-002 | High     | 320 px reflow           | The eight-guest consolidated shopping list exceeded the viewport because long recipe-ID groups retained their max-content flex width. | Repaired | Allowed both flex children to shrink and wrap, then stacked amount/item and source IDs below 42 rem. The repeated 320 px matrix verifies zero horizontal overflow.                                                    |
| P7-H-003 | High     | Keyboard access         | The Tools shopping list had a constrained scroll area but was not focusable, preventing keyboard scrolling in Safari.                 | Repaired | Added a named `tabindex="0"` list region. Repeated axe and keyboard checks cover the scroll container.                                                                                                                |
| P7-M-001 | Medium   | Screen-reader landmarks | The policy/standards footer group carried an accessible label on a generic `div`, so it was not exposed as a navigation landmark.     | Repaired | Replaced the generic container with a uniquely named `nav`; source and browser landmark checks cover the result.                                                                                                      |
| P7-L-001 | Low      | Live-region behavior    | The permanent non-production banner used `role="status"`, which could cause an unnecessary page-load announcement.                    | Repaired | Kept the visible banner and removed live-region semantics; the document title and banner still communicate preview state.                                                                                             |

Unresolved critical defects: **0**  
Unresolved high-severity defects: **0**

## Security policy notes

- CSP permits only same-origin resources plus `data:` images used by local rendering.
- Three executable inline module hashes are explicitly allowlisted. `unsafe-inline`, `unsafe-eval`, remote script origins, inline styles, and inline event handlers are not allowed.
- HSTS is intentionally deferred until an approved production hostname is served exclusively over verified HTTPS. This is a release gate, not an unresolved preview defect.
- Any future analytics, ads, email, media, merchant, or form integration must update the policy narrowly and pass the complete security-header validator before release.

## Human-review boundary

Automated and headless-browser QA cannot complete named screen-reader, cognitive-load, physical-device, legal, privacy, merchant, food-safety, cultural, media-rights, or test-kitchen approval. Those remain Phase 8 handoff queues rather than software defects.
