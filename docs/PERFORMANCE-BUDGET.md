# Performance Budget

Budgets apply to representative home, category, recipe, guide, and shop pages on production-like builds. They are regression thresholds, not promised Core Web Vitals.

| Metric/resource                        | Initial budget                                 |
| -------------------------------------- | ---------------------------------------------- |
| Initial route JavaScript, compressed   | ≤ 60 KB; recipe target ≤ 35 KB                 |
| Initial CSS, compressed                | ≤ 45 KB                                        |
| Critical font transfer                 | 0 KB until an approved local font is justified |
| Initial above-fold media               | ≤ 350 KB mobile, ≤ 600 KB desktop              |
| Total page transfer before interaction | ≤ 900 KB mobile                                |
| Third-party scripts before consent     | 0                                              |
| CLS in lab smoke test                  | ≤ 0.10                                         |
| LCP in lab smoke test                  | ≤ 2.5 s target, measured and reported          |
| INP proxy/interaction delay            | ≤ 200 ms target, measured and reported         |

Static generation is the default. Media reserves dimensions and serves responsive AVIF/WebP with fallback. Below-fold media and widgets lazy load. Analytics, ads, email, and affiliate scripts are deferred and consent-aware where required. A >10% material regression in transfer, JavaScript, or lab timing fails without a documented exception.

## Phase 7 production-build smoke

The repeated local Chromium pass measured maximum LCP at 108 ms, CLS at 0, load at 37.9 ms, and the interaction-delay proxy at 13.2 ms. These local values prove the preview is not blocked or shifting; they are not field Core Web Vitals or a production-network forecast.

The final build contains 4,987 compressed CSS bytes, zero external JavaScript bytes, at most 5,639 compressed inline JavaScript bytes, zero approved media/font/provider/ad payload, and zero third-party script. `scripts/validate-built-preview.mjs` now fails the build if maximum estimated initial compressed transfer exceeds 900 KB or if the existing CSS/JavaScript budgets regress.

## Phase 9 image-led production-build smoke

The Phase 9 production build emits 1,296 optimized image outputs (405 AVIF and 405 WebP plus JPEG fallbacks/masters). The home hero's responsive AVIF candidates are 22,332 bytes at 360 pixels and 203,988 bytes at 1600 pixels; both remain below the initial above-fold media budgets. The largest generated output anywhere in the build is 533,340 bytes and is a lazy, non-critical derivative.

The static validator reports 6,817 compressed CSS bytes, zero external JavaScript, at most 5,631 compressed inline JavaScript bytes, maximum compressed HTML of 26,132 bytes, maximum estimated compressed initial non-media transfer of 32,949 bytes, and zero third-party scripts. Local Chromium observed maximum LCP at 88 ms and CLS at 0 across 84 route/viewport checks. These local measurements validate regression behavior only; public-preview and field performance remain separate release gates.
