# Production Performance Budget

This is an enforced production-build policy, not a promise of field Core Web
Vitals. `npm run build` runs both the policy unit test and
`scripts/validate-built-preview.mjs` against the emitted `dist/` artifacts.
The validator measures the actual request candidates in every eager hero; it
does not ignore the `<img>` fallback or candidates that are only selected on a
high-DPR device.

| Metric                 |           Hard ceiling | Build measurement                                                                                              |
| ---------------------- | ---------------------: | -------------------------------------------------------------------------------------------------------------- |
| HTML                   | 15 KiB gzip (15,360 B) | Largest emitted HTML document after gzip                                                                       |
| Shared CSS             |  40 KiB raw (40,960 B) | Sum of emitted CSS bytes before compression                                                                    |
| First-party JavaScript | 25 KiB gzip (25,600 B) | All emitted external first-party JS plus the largest route's inline JS                                         |
| Third-party JavaScript | 50 KiB gzip (51,200 B) | Current contract is stricter: zero third-party script tags are permitted                                       |
| Mobile hero            |      35 KiB (35,840 B) | Largest eager candidate available at `max-width: 600px`, including WebP, JPEG, and `<img>` fallback candidates |
| Desktop hero           |    120 KiB (122,880 B) | Largest eager hero candidate across every delivered candidate and fallback                                     |

The initial verified baselines in `data/performance-budget.json` are 10,767 B
gzip HTML, 34,423 B raw CSS, 5,296 B first-party JavaScript gzip, 0 B
third-party JavaScript, 33,533 B mobile hero, and 104,381 B desktop hero. They
were captured from the emitted build, not estimated from source files.

Responsive media uses only WebP and JPEG derivatives at 360, 600, 960, and
1,200 pixels. The mobile `<picture>` sources and the non-`picture` `<img>`
fallback are capped at 600 pixels; that prevents a 2x/3x mobile device from
silently selecting a desktop-size source. AVIF is intentionally excluded from
this build because it previously pushed the Cloudflare Pages image build toward
the platform timeout. Every emitted `<img>` must retain intrinsic `width` and
`height`.

## Regression control and signed exceptions

`data/performance-budget.json` records a baseline for every metric. A result
more than 10% above its baseline fails even if it remains below the hard
ceiling. Hard ceilings cannot be waived. A baseline-regression exception is
accepted only when its record in `signedExceptions` contains all of the
following and has not expired:

```json
{
  "id": "PERF-YYYY-NNN",
  "metrics": ["compressedHtmlBytes"],
  "maxBytes": { "compressedHtmlBytes": 12000 },
  "rationale": "Specific, time-bounded reason for the regression.",
  "signedBy": "Portfolio Web Performance Owner",
  "signedAt": "2026-08-23T00:00:00.000Z",
  "approvalReference": "PR-123",
  "expiresAt": "2026-09-01T00:00:00.000Z"
}
```

The exception is metric-scoped, cannot approve more bytes than `maxBytes`, and
is an accountable approval record rather than a blanket switch. Its signature
time cannot be in the future or after its expiry. After a successful approved
release, update a baseline only from the retained CI artifact measurements and
in the same reviewed change that explains why the new normal is justified.

Run the gates locally with:

```sh
npm run build
npx vitest run tests/p2-performance-budget.test.ts
node scripts/validate-built-preview.mjs
```

## Field Core Web Vitals ownership and runbook

The **Portfolio Web Performance Owner** owns the field-CWV review; the release
owner must provide that role with the production URL and deployment timestamp.
No analytics or third-party monitoring script is added merely to collect this
data.

Within two business days after a production deployment, and monthly while the
site is public, the owner should:

1. Review the mobile and desktop 28-day p75 Core Web Vitals in Google Search
   Console and, where available, CrUX origin/page data.
2. Record the source date range, sample sufficiency, LCP, INP, and CLS in the
   release evidence. If the property has insufficient field traffic, record
   that fact; do not describe lab results as field CWV.
3. Open a remediation issue for a sustained p75 regression or for LCP above
   2.5 s, INP above 200 ms, or CLS above 0.10. Tie any related build-budget
   regression to the metric-scoped signed exception above.
4. Re-check the next 28-day window and close the issue only after the field
   signal recovers or the evidence shows that the sample remains insufficient.

The static budget gate remains required even when no field sample is available.
