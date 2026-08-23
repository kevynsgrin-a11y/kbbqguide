# HSTS rollout record

## Current policy

The Pages artifact sends this policy on canonical-apex content responses:

```text
Strict-Transport-Security: max-age=31536000
```

It deliberately does not include `includeSubDomains` or `preload`. This is a
one-year, host-only rollout that hardens the verified apex hostname without
making an unverified subdomain permanently HTTPS-only in visitors' browsers.

## Evidence recorded on 2026-08-23

- `https://kbbqguide.com/` returned a successful HTTPS response.
- `https://www.kbbqguide.com/` returned a HTTPS redirect to the canonical
  apex URL.
- Both HTTP endpoints redirected to HTTPS.

The active Cloudflare credential could read the zone identity but could not
read the DNS-record inventory or the zone `security_header` setting. It is
therefore not evidence that every existing web subdomain is HTTPS-only.

## Preconditions for `includeSubDomains`

Before replacing the policy with the following exact value, record all of the
following in the release evidence:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

1. Export the complete Cloudflare DNS record inventory using an account with
   zone-DNS read permission.
2. Identify every hostname that accepts browser HTTP(S) traffic, including
   redirects, preview, administrative, status, and future wildcard routes.
3. Verify a valid HTTPS certificate and an HTTPS-only redirect path for each
   web hostname. Remove or migrate any HTTP-only hostname first.
4. Confirm the final value appears exactly once on the apex and every
   canonical web hostname after cache propagation.
5. Save the inventory, command output, approver, and timestamp with the
   release record.

Do not enable `preload` until the site has safely operated with
`includeSubDomains` and the preload program requirements have been separately
reviewed. HSTS is browser-cached; rollback requires serving a shorter value to
clients that can still reach the hostname and cannot reliably undo a preload
submission.
