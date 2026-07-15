# Provider Setup Plan

Checkpoint date: 2026-07-14

No provider is installed, linked, authenticated, or configured. This plan keeps provider selection reversible and credentials outside static output.

| Capability               | Candidates to evaluate                           | Required approval before setup                                  |
| ------------------------ | ------------------------------------------------ | --------------------------------------------------------------- |
| Social scheduling        | Buffer or another approved scheduler             | channel terms, draft workflow, OAuth scopes, retention          |
| Creator email/commerce   | Kit                                              | consent, suppression, postal address, data processing, secrets  |
| Budget email alternative | MailerLite                                       | same email/privacy gate; choose one primary provider            |
| Instagram messaging      | Manychat                                         | platform permission, transparent automation, consent separation |
| Orchestration            | Make, Zapier, or self-hosted n8n                 | webhook auth, least privilege, retry/idempotency, logs          |
| Measurement              | GA4 plus Search Console or approved alternatives | privacy/consent, data minimization, retention                   |
| Commerce                 | Stripe or selected email-platform commerce       | legal entity, taxes, refunds, security, webhook verification    |

Use OAuth where available and server-side secret storage. Never commit social passwords, API keys, webhook secrets, subscriber exports, merchant IDs, or production tokens. Request only the minimum scopes, separate preview and production credentials, rotate on exposure, and document revocation/rollback.

The integration order is content validation → preview → human content approval → production publish → authenticated webhook → provider drafts → campaign metadata → human marketing approval → send/publish → consented measurement → review. No generative draft may skip either human gate.
