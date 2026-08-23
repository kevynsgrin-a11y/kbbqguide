# Route-Scoped Stale Static-Path Remediation

This Worker is intentionally limited to the retired preview-sitemap wildcard
and two exact legacy paths on the canonical `kbbqguide.com` hostname:

- `/sitemap-preview.xml*` — return a non-indexable 404 for the retired preview
  sitemap.
- `/site.webmanifest` — return a non-indexable 404 because KBBQGuide is an
  intentionally non-PWA site.
- `/robots.txt` — return the current minimal `Allow: /` policy while an older
  edge object is still serving a stale response.

It never proxies traffic, makes no subrequests, and must not be broadened to a
directory or wildcard application route. The route patterns live in
`wrangler.jsonc`; the worker itself branches only on `/robots.txt`, with every
other attached path receiving the same no-store tombstone response.

When Cloudflare cache-purge permission is available, purge the canonical host
and verify the Pages deployment directly serves the current responses. Only
then may the temporary `/robots.txt` and `/site.webmanifest` routes be
removed in a source-controlled change. Keep `/sitemap-preview.xml*` until the
retired URL has no remaining external traffic or documented references.
