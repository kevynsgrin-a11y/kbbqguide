# Deployment Runbook

Runbook status: instructions only; no deployment authorized  
Target: Cloudflare Pages-compatible static output  
Source check date: 2026-07-14

## Hard gate

Do not create a remote project, connect a repository, upload `dist`, change DNS, or make a public URL until all P0 human-review items are evidenced, the release candidate passes the full verification chain, and a named approver grants **explicit release authorization** for a specific immutable candidate.

## Recommended release path: Git integration

Cloudflare Pages can build connected GitHub or GitLab repositories on pushes and provides branch previews and pull-request checks. Select this model only after the repository owner approves automatic-deployment behavior. Cloudflare documents that a Git-integrated Pages project cannot later be converted into a Direct Upload project, so treat project type as a one-time architecture decision. See [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/).

### 1. Freeze and verify locally

From a clean, approved candidate on Node.js 24+ and npm 11+:

```bash
npm ci
sha256sum --check docs/final-file-manifest.sha256
npm run check
npm run audit
```

Confirm that placeholder replacement, final domain configuration, media, approvals, and any intentionally activated providers have their own updated tests and evidence. Confirm the approved build output is `dist/` and retain the candidate commit and archive SHA-256.

### 2. Create a gated Pages project

After authorization, a Cloudflare account owner may connect the approved repository in Workers & Pages. Use:

- production branch: the organization’s protected release branch;
- build command: `npm run build`;
- build output directory: `dist`;
- root directory: the project root, or `korean-bbq-guide` if this folder lives in a monorepo;
- runtime: Node.js 24, pinned through the provider’s supported build-environment setting;
- secrets: none for this static preview baseline.

Initially disable automatic production branch deployments or keep the production branch unmerged. Permit only the specifically approved preview branch. Cloudflare’s documented branch controls can pause production and preview automation.

### 3. Verify the branch preview

On the exact candidate deployment, repeat route sampling at mobile, tablet, desktop, and wide viewport sizes; keyboard and assistive-technology checks; no-JavaScript behavior; print; media; forms/consent; disclosure; canonical and structured-data review; link crawl; 404 behavior; and performance checks. Capture live response headers and confirm `_headers` applies the expected seven-header policy and current CSP hashes. Keep preview URLs `noindex` and out of public navigation.

### 4. Authorize production

Record the candidate commit, manifest/archive hash, preview deployment ID, production hostname, approver, deployer, time window, rollback owner, and known-good rollback deployment. Obtain a second explicit production approval. Merge or promote only the recorded candidate; do not combine unrelated changes.

### 5. Post-deployment verification

Immediately verify HTTPS and certificates, homepage and representative recipe/guide/menu/tool/policy routes, robots and sitemaps, canonicals, feed, security headers/CSP, zero unexpected third-party requests, consent/provider behavior, forms, commercial disclosures, media, analytics only if separately approved, and DNS variants. Monitor logs and user-impact signals through the agreed observation window. Indexing remains a separate approval; do not remove preview safeguards merely because deployment succeeded.

## Direct Upload alternative

Use Direct Upload only if the release owner explicitly chooses a local or external CI build model. Cloudflare documents that a Direct Upload project cannot later switch to Git integration without creating a new project. The documented Wrangler flow uploads the prebuilt folder with `npx wrangler pages deploy dist`; that command is a production-impacting action and is intentionally not executed here. See [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Static header note

Cloudflare Pages reads a plain-text `_headers` file from the static asset directory. This project emits `public/_headers` into `dist/_headers`; verify actual responses on the final hostname. See [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/).

Before enabling the P2 HTML edge-cache rule, follow
[`docs/EDGE-CACHE-ROLLOUT.md`](./EDGE-CACHE-ROLLOUT.md). The source header
contract is not evidence that the required Cache Rule, response-code guard, or
post-deploy purge has been configured.
