# Origin Diagnosis — apex 502 (2026-07)

_Blocker P0-2. Read-only diagnosis per directive §5. No production change was made.
This document ends with the operator decision required to remediate._

## Summary

- **Symptom (from the 2026-07-17 human review):** `https://kbbqguide.com/` returns
  **502 / connection refused**. The immutable Cloudflare Pages preview
  `https://16372aff.kbbqguide.pages.dev/` is **healthy**.
- **Most likely cause:** the apex custom domain is **not correctly attached to / routed to the
  Pages project** — either the custom domain was never (or is no longer) added to the Pages
  project, or the apex DNS record points at a defunct origin / a proxied record with no working
  backend. A healthy `*.pages.dev` with a dead apex almost always means the fault is in the
  **domain-to-project binding or the apex DNS**, not in the build (the build is provably fine).

## Evidence gathering — what this environment could and could not collect

**Environment limitation (recorded honestly):** this Phase 10 container has **no live external
network egress**. `dig` is not installed, and the agent proxy denies `CONNECT` to external hosts:

```
$ curl -svI https://kbbqguide.com/      → HTTP/1.1 403 Forbidden (proxy CONNECT tunnel denied)
$ curl -svI https://www.kbbqguide.com/  → HTTP/1.1 403 Forbidden (proxy CONNECT tunnel denied)
$ curl -svI https://kbbqguide.pages.dev/→ HTTP/1.1 403 Forbidden (proxy CONNECT tunnel denied)
$ dig kbbqguide.com A +short            → dig: command not found
```

The proxy status endpoint confirms these are **policy denials at the gateway**, not real origin
responses (`kind: "connect_rejected"`, `detail: "gateway answered 403 to CONNECT"`). **Therefore
the live DNS/HTTP evidence below must be collected by the operator** from an unrestricted network.
The 502 finding is taken from the 2026-07-17 review report.

### Operator: collect this evidence first (copy/paste)

```bash
dig kbbqguide.com A +short
dig kbbqguide.com AAAA +short
dig www.kbbqguide.com +short
dig www.kbbqguide.com CNAME +short
dig kbbqguide.com NS +short
curl -svI https://kbbqguide.com/ 2>&1 | head -50
curl -svI https://www.kbbqguide.com/ 2>&1 | head -50
curl -svI https://kbbqguide.pages.dev/ 2>&1 | head -50
```

Compare the apex `NS` records to the nameservers Cloudflare shows for the zone (Cloudflare
dashboard → the domain → Overview). If the `NS` do not match Cloudflare's assigned nameservers,
the zone is not being served by Cloudflare and none of the Pages routing applies — that alone
explains the apex failure.

### Repo evidence (collected here, read-only)

- **No `wrangler.toml`, no `_redirects`, no Workers config** in the repo. So the apex failure is
  **not** caused by a repo-level redirect rule or a Workers route committed to source.
- `public/_headers` exists and is correct (CSP + seven-header policy → `dist/_headers`); it only
  affects responses **once Pages is serving**, so it is not implicated in a 502.
- `astro.config.mjs` sets `site: 'https://kbbqguide.com'` and `trailingSlash: 'always'`;
  `src/lib/seo.ts` sets `siteOrigin = 'https://kbbqguide.com'`. Canonical URLs therefore point at
  the apex — which makes fixing the apex (rather than moving to `www`) the natural target.
- Per `docs/DEPLOYMENT-RUNBOOK.md`, the intended model is Cloudflare Pages **Git integration**
  (build `npm run build`, output `dist`). A `*.pages.dev` host is live, which confirms a Pages
  project exists and builds succeed.

## Ranked hypothesis tree

Ranked by likelihood given "healthy `*.pages.dev`, dead apex 502/refused".

### H1 — Custom domain not attached to the Pages project (most likely)

- **Mechanism:** a Pages project serves its `*.pages.dev` host immediately, but the apex only
  serves once the custom domain is **added to that specific project** (Pages → project → Custom
  domains) _and_ validated. If it was never added, or was detached, the apex has no route to the
  project and returns a 502/again-nothing at the edge.
- **Evidence for:** `*.pages.dev` healthy while apex fails is the textbook signature. No repo
  redirect/Workers config exists to explain the failure elsewhere.
- **Evidence against:** none available without dashboard access.
- **Remediation (operator):** Cloudflare dashboard → Workers & Pages → **kbbqguide** project →
  **Custom domains** → **Set up a custom domain** → add `kbbqguide.com` (and `www.kbbqguide.com`).
  Accept the DNS records Cloudflare offers (it creates the `CNAME`/flattened apex automatically
  when the zone is on Cloudflare). Wait for status **Active**. Re-test the apex.

### H2 — Apex DNS points at a defunct origin (e.g. old host / parked IP)

- **Mechanism:** the apex `A`/`AAAA` (or `CNAME`-flattened) record still points at a previous host
  or a placeholder IP that no longer answers, so the edge cannot reach a backend → 502/refused.
- **Evidence for:** "connection refused" phrasing in the review is consistent with a record
  pointing at something not listening.
- **Remediation (operator):** in Cloudflare DNS, **remove** any stale apex `A`/`AAAA` record and
  let the Pages custom-domain attachment (H1) create the correct record; or point the apex at the
  Pages project per Cloudflare's custom-domain flow. Do **not** point it at a hand-typed IP.

### H3 — Proxied (orange-cloud) record with no valid origin

- **Mechanism:** the apex record is **Proxied** through Cloudflare but the origin it proxies to is
  down/absent, so Cloudflare returns 502 from its edge while the CDN itself is up.
- **Evidence for:** 502 (a gateway error) rather than `NXDOMAIN`/timeout suggests Cloudflare's edge
  is answering but has no healthy origin.
- **Remediation (operator):** ensure the apex is served **by the Pages project** (which does not
  need a separate origin) rather than proxying to a dead server. Attaching the custom domain to
  Pages (H1) supersedes any proxied-to-origin setup for the apex.

### H4 — A Workers route or Redirect Rule intercepting the apex

- **Mechanism:** a Workers route (`kbbqguide.com/*`) or a dashboard Redirect/Bulk rule intercepts
  the apex and fails (script error/no backend), producing 5xx before Pages is reached.
- **Evidence for:** none in-repo (no `wrangler.toml`), so any such route would be **dashboard-only**.
- **Remediation (operator):** Cloudflare → the zone → Workers Routes and Rules → Redirect/Transform
  Rules. Disable or remove any rule matching `kbbqguide.com/*` that is not intentional, then re-test.

### H5 — SSL/TLS mode mismatch (e.g. "Full (strict)" against a non-TLS origin)

- **Mechanism:** if the apex proxies to an origin and the zone SSL mode is Full (strict) while the
  origin lacks a valid cert (or vice-versa), requests fail. Less likely to read as a clean 502 for
  a static Pages target, but possible if H3/H4 also apply.
- **Remediation (operator):** for a Pages-served apex, no custom origin cert is needed; attaching
  the custom domain to Pages (H1) and letting Cloudflare manage the edge cert is the correct state.
  If an origin is intentionally in the path, align the SSL mode to the origin's certificate.

## Decision matrix (operator)

| If `dig`/`curl` shows…                | Most likely            | Do                                                            |
| ------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Apex `NS` ≠ Cloudflare nameservers    | Zone not on Cloudflare | Fix registrar nameservers to Cloudflare's, then H1            |
| Apex has no `A`/`AAAA`/`CNAME`        | H1                     | Attach custom domain to Pages project                         |
| Apex record present, points at old IP | H2                     | Remove stale record; attach domain to Pages                   |
| Apex proxied, 502 from edge           | H3/H4                  | Ensure Pages serves apex; remove stray Workers/redirect rules |
| TLS handshake error to origin         | H5                     | Align SSL mode / use Pages-managed cert                       |

The canonical configuration (`site: https://kbbqguide.com`) means the **apex should serve the
Pages project directly**. The single highest-value action is **H1: attach `kbbqguide.com` (and
`www`) to the `kbbqguide` Pages project and wait for Active**, which also resolves H2/H3 for the
apex.

## Non-destructive verification after the fix (operator)

```bash
curl -sI https://kbbqguide.com/ | head        # expect 200 and Cloudflare headers
curl -s https://kbbqguide.com/robots.txt       # expect the noindex-preview robots policy
curl -sI https://kbbqguide.com/_headers        # confirm the seven-header/CSP policy applies
```

Then, if satisfied, set `production.originStatus: "resolved"` in `project-state.json` (or ask the
agent to) and record the date. **Reminder:** fixing the origin does **not** authorize indexing;
`noindex` stays until the separate operator release-authorization step (see `docs/GOVERNANCE.md`).

---

**No production change was made. Operator decision required.**
