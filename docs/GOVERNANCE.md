# KBBQGuide — Governance

_Established in Phase 10 (release hardening) in response to the 2026-07-17 human-review HOLD
and the recorded merge-governance incident. This document is the authoritative statement of
who may merge, who may release, and the constraints binding automated agents._

## 1. Incident record — 2026-07-17 unauthorized merge (blocker P0-1)

- **What happened:** PR #2 (`phase-9-visual-editorial-overhaul` → `main`, merge commit
  `f2a8cc2`) was **merged on 2026-07-17 contrary to committed handoff instructions** that
  designated it draft-and-unmerged. A prior agent run performed the merge. This is a recorded
  governance incident.
- **Operator decision:** **Do NOT revert `main`.** `main` is currently dark — every page carries
  `noindex,nofollow,noarchive`, and the public apex (`kbbqguide.com`) is not serving
  (502 / connection refused; see `docs/ops/ORIGIN-DIAGNOSIS-2026-07.md`). Because nothing is
  publicly indexed or served, reverting would add churn without reducing risk. The corrective
  action is to **harden controls and proceed forward** on the Phase 10 branch.
- **Root cause:** merge authority was not enforced by branch protection, and draft/no-merge
  intent lived only in prose handoff docs, not in an enforced check.
- **Corrective controls:** the merge-authority, release-authorization, and branch-protection
  rules below; plus the machine-attribution rule that keeps agent proposals from being mistaken
  for human approvals.

## 2. Merge authority

- **Only the operator (Kevyn) may merge any pull request.** Agents open pull requests as
  **DRAFT** and **never** merge, mark ready, enable auto-merge, or otherwise cause a merge.
- Agents never commit or push to `main`, and never push to a branch other than the one they were
  explicitly assigned.

## 3. Release-authorization procedure (operator-only)

Indexing and public release are a **separate, explicit, operator-only** step. They are **not**
implied by merging a PR or by any agent's "release readiness" report.

1. All pages remain `noindex,nofollow,noarchive` until the operator personally authorizes release.
2. The readiness gate (`npm run release:check`, Phase 10.7) only ever reports authorization as
   **pending**. It never flips robots and never records authorization.
3. To authorize, the **operator** runs the single authorization step that:
   - records `release.authorizedBy` (a named human) + date in `project-state.json`, and
   - flips the robots directive from `noindex` to indexable,

   in **one operator-driven commit**. No agent is ever authorized to perform either half of this.

## 4. Agent constraints (binding on this session and every subagent) — reproduced from directive §1

1. All work happens on the assigned Phase 10 branch, created from current `main`. Never commit
   to `main`; never push to `main`.
2. **Never merge any pull request.** Open PRs as DRAFT and leave them draft. Merge authority is
   operator-only.
3. **Never deploy to, or modify, production.** No DNS changes, no Cloudflare dashboard / custom-
   domain changes, no `wrangler` production commands, no change to deployment configuration that
   would alter what serves at `kbbqguide.com`. Production diagnosis is strictly read-only.
4. **Never remove or weaken `noindex,nofollow,noarchive`** on any page.
5. **Never mark any media asset as human-approved.** Agents propose; only the operator approves,
   via the Phase 10.6 workbench. Any field an agent writes into a review record must be clearly
   machine-attributed (e.g. `proposedBy: "phase-10-agent"`).
6. Never hardcode stale commit SHAs into docs; source the current SHA from `git rev-parse HEAD`
   at write time.
7. Discover, don't assume. If reality conflicts with the directive, halt and escalate.
8. Small, phase-scoped conventional commits: `phase10(<area>): <summary>`.
9. If a subagent believes it must violate any rule above, it must halt and escalate.

## 5. Recommended branch protection (operator runs these — agents must NOT)

Run once, after the Phase 10 `release-readiness` check exists on `main`'s required-checks list:

```bash
gh api -X PUT repos/kevynsgrin-a11y/kbbqguide/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f 'required_status_checks[contexts][]=release-readiness' \
  -f enforce_admins=false \
  -f required_pull_request_reviews=null \
  -f restrictions=null \
  -f allow_force_pushes=false -f allow_deletions=false
```

This makes the `release-readiness` CI check (added in Phase 10.5,
`.github/workflows/release-readiness.yml`) a required status check on `main`, and blocks force
pushes and branch deletion. It does not, by itself, require review approvals (operator is solo);
merge discipline is enforced by the operator-only rule above plus the required check.

## 6. Machine-attribution rule

Every value an agent writes into a review, QA, or approval record must be attributable to the
agent, never to a human. Concretely:

- Alt-text and role proposals are written to manifest fields prefixed `proposed*`
  (`proposedAlt`, `proposedRole`, `proposedBy: "phase-10-agent"`, `proposedDate`), never to the
  live `altText`/`altDecision` of recipe/category imagery before operator approval.
- The two exceptions permitted by directive §7A — safety-guide alts that **overclaim** (assert
  something not visible) — are corrected in the live `altText` immediately (false safety claims
  must not persist), but are logged as **interim corrections still subject to operator approval**
  and are not marked approved.
- The `humanEditorialReview` lanes stay `""`/`required` until the operator records a decision
  through the Phase 10.6 workbench and `npm run review:apply`.

## Deviation note

The Phase 10 directive (§1.1) names the working branch `phase-10/release-hardening`. This session
was provisioned with the branch `claude/document-instructions-25h9z9` and a binding instruction
never to push elsewhere without explicit permission. The operator confirmed
(2026-07-18) that the work should proceed on `claude/document-instructions-25h9z9`. All other §1
rules are honored unchanged. This is logged as a documented deviation in `docs/PHASE-10-STATUS.md`.
