# Rollback Runbook

Runbook status: instructions only  
Target: authorized Cloudflare Pages production release  
Source check date: 2026-07-14

## Trigger and authority

Rollback for broken navigation, unavailable pages, security-policy regression, unsafe or materially incorrect content, consent/data leakage, serious accessibility failure, corrupted media, or a release-candidate mismatch. The incident commander or designated release owner authorizes rollback; the deployer records the action. If safety, privacy, or security is uncertain, prefer containment and rollback.

## Immediate containment

1. Stop additional merges, deploy hooks, scheduled sends, and production promotions.
2. Record UTC/local time, current deployment ID, candidate commit and checksum, symptoms, affected routes/users, and evidence.
3. Disable a separately activated provider or commercial feature at its own kill switch when that is faster and safer than a whole-site rollback.
4. Confirm the intended rollback target is a previously successful production deployment with known-good evidence.

## Cloudflare Pages rollback

Cloudflare documents that successful production deployments are valid rollback targets and that **preview deployments are not valid rollback targets**. In the Pages project, open **Deployments**, find the known-good production deployment, open its three-dot action menu, select **Rollback to this deployment**, review the target, and confirm. See [Cloudflare Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/).

Do not guess from a friendly URL. Match the recorded deployment ID, commit, timestamp, and release log. If no valid known-good production deployment exists, pause traffic or publishing through the authorized platform/domain procedure and escalate; do not improvise an unverified upload.

## Post-rollback verification

Verify the active production deployment ID, HTTPS/DNS, homepage, representative recipe/guide/menu/tool/policy routes, robots/sitemaps/canonicals, response headers and CSP, forms/consent, commercial kill switches, media, redirects and 404 behavior. Confirm the triggering symptom is gone and no new critical/high regression appears. Keep monitoring through the incident window.

## Recovery and record

Preserve logs and the failed artifact. Document impact, timeline, root cause, containment, rollback target, validation evidence, and owner. Fix forward on a new candidate; regenerate checksums; rerun `npm ci`, `npm run check`, `npm run audit`, preview QA, and affected human gates. Require fresh production authorization. Never redeploy the failed candidate merely because the code was locally changed.

DNS, certificate, account compromise, or header propagation incidents may require separate provider or registrar procedures. HSTS is intentionally absent from this baseline until the final hostname is independently approved as HTTPS-only; do not add or remove it during an incident without security ownership.
