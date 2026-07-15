# KBBQGuide

Static-first Astro project. This final build checkpoint contains Phases 0–8: environment and architecture, the locked inventory, the complete eight-batch editorial corpus, the non-production UI/media system, SEO/guides/menus/tools, the inert revenue/social/email/messaging/analytics layer, complete QA/hardening, and the operational handoff. It contains exactly 80 complete recipe drafts, 12 guide drafts, three guest-count menus, nine inactive merchant records, and 116 generated HTML pages. Every draft remains unpublished and every commercial, collection, tracking, indexing, and deployment capability remains disabled.

## Requirements

- Node.js 24 or later
- npm 11 or later

## Commands

```bash
npm install
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm test
npm run validate:phase1
npm run validate:phase2
npm run validate:phase3-batch1
npm run validate:phase3-batch2
npm run validate:phase3-batch3
npm run validate:phase3-batch4
npm run validate:phase3-batch5
npm run validate:phase3-batch6
npm run validate:phase3-batch7
npm run validate:phase3-batch8
npm run validate:phase3
npm run validate:phase4
npm run validate:phase5
npm run validate:phase6
npm run validate:phase7
npm run validate:phase8
npm run validate:preview
npm run validate:headers
npm run build
npm run preview
npm run audit
```

`npm run check` runs the complete local Phase 8 verification chain. The build emits 116 non-indexed static preview pages plus preview-safe discovery artifacts and a Cloudflare Pages security-header policy. It crawls titles, canonicals, JSON-LD, links, sitemap parity, tool fallbacks, disclosures, disabled forms/ads/revenue modules, placeholder-media honesty, security headers, CSP hashes, performance budgets, and the final handoff controls. The build requires zero outbound anchors, no enabled collection control, no unsafe script/style policy, and no unresolved critical/high defect. Production publishing remains disabled.

## Deployment target

The locked output is static HTML in `dist/`. The target is Cloudflare Pages at `https://kbbqguide.com`, with build command `npm run build` and output directory `dist`. The owner has authorized deployment of the no-index editorial preview. No remote project or DNS change has been created from this workspace because Cloudflare is not authenticated and no Git repository exists yet.

## Phase boundary

Read `project-state.json` and `docs/PHASE-8-FINAL-HANDOFF.md` before continuing. Phase 8 and the planned build are complete, and the KBBQGuide brand/domain release candidate is ready. Deployment of the no-index editorial preview is authorized; public indexing is not. Do not activate indexing, merchants, collection, tracking, providers, external sends, or approved-content claims until their individual gates are evidenced and approved.
