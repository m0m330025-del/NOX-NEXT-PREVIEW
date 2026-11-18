# NOX NEXT — Minimal Auth & Membership Patch Proposal
Date: 2026-11-18
Branch: `feature/auth-login-staging`
Status: proposal only; no application/backend/schema/runtime/deployment changes made.

## Decision summary

The smallest safe implementation is a server-first membership gate, followed by registration/admin workflows and then browser UI integration. Do not start by merely adding a frontend redirect: it would not protect API data.

This is an AI-generated engineering proposal, not human engineer approval or a live Appwrite audit.

## A. Exact route classification from the inspected Function source

Source revision: `functions/moderation/src/index.js`, blob `56d446ec0c8f65ab965f523fcd9e793c8b774e1c`.

All routes below currently pass through JWT account authentication in the inspected handler. Until a product-level public-read policy is explicitly defined, treat these as **member-only** and apply the membership gate before entering the route handler.

| Route | Method | Classification proposal |
|---|---|---|
| `/friends/lookup` | GET | Member-only (profile lookup can expose member data) |
| `/notifications` | GET | Member-only |
| `/notifications/read` | POST | Member-only |
| `/friends/requests` | POST | Member-only |
| `/friends/requests` | GET | Member-only |
| `/friends/requests/respond` | POST | Member-only |
| `/friends/requests/cancel` | POST | Member-only |
| `/friends` | GET | Member-only |
| `/conversations` | GET/POST | Member-only |
| `/messages` | GET/POST | Member-only |
| `/reports` | POST | Member-only for submission; moderation review is admin-only |
| `/reports` | GET | Admin-only unless current product semantics prove it is a user's own-report listing; verify before implementation |
| `/blocks` | GET/POST/DELETE | Member-only |
| `/moderation...` | any supported method | Admin-only; currently placeholder 501 after moderator check |
| Unknown route | any | 404; no data access |

The gate must execute after JWT identity verification and before route dispatch/data access. Do not place a membership bypass on `/friends/lookup` without a documented public-profile data contract.

## B. Minimal source patch proposal (not applied)

### 1. `functions/moderation/src/auth-guards.js` — new
Responsibilities:
- Verify caller identity using the Appwrite user JWT flow already used in `index.js`.
- Load the caller's membership row by immutable Appwrite user ID.
- Validate the exact canonical state.
- Return a structured decision: authenticated, approved member, authorized admin.
- Fail closed for missing row, duplicate/conflicting rows, malformed state, database errors, and unknown state.
- Never read approval or role from request body, query string, URL, local storage, or browser claims.

Avoid exposing membership data beyond the minimum state needed for routing.

### 2. `functions/moderation/src/membership-service.js` — new
Responsibilities:
- Canonical state constants and allowed transition table.
- Validate transitions and required decision reasons.
- Provide service-level methods for status lookup and state changes.
- Ensure a rejected member cannot be silently re-approved; reconsideration is a separate audited process.

### 3. `functions/moderation/src/index.js` — guarded modification
Proposed order:
1. Handle OPTIONS and method validation.
2. Verify JWT and resolve caller identity (existing behavior).
3. Resolve route.
4. For member routes, call the shared membership guard and return 403/appropriate non-leaking response unless state is APPROVED.
5. For admin routes, call a separate admin authorization guard.
6. Dispatch the route.
7. Ensure no route can access protected store methods before the relevant guard.

Add a status route, e.g. `GET /membership/status`, authenticated but available to all authenticated membership states so pending/rejected/suspended users can see their own safe status. This endpoint must not expose internal notes, other users, audit data, or admin identifiers.

### 4. `functions/moderation/src/store.js` — guarded modification
Add narrowly scoped persistence methods for:
- Get membership by Appwrite user ID.
- Create pending membership idempotently.
- Update membership state with concurrency protection.
- Write append-only audit event.
- Read/write scheduled batch metadata and per-member outcomes.

Do not mix resource-level conversation membership rows with account-level membership approval.

### 5. `scripts/migrations/NNN_membership_schema.mjs` — new
Additive schema only. Proposed logical records:
- Membership: account user ID (unique), NOX ID (unique if assigned), canonical state, created/updated timestamps, decision actor/time, safe reason reference/metadata.
- Audit event: actor ID, subject ID, action, previous/new state, reason, timestamp, request/correlation ID.
- Scheduled batch: immutable member snapshot, initiating admin, scheduled UTC timestamp plus declared timezone, batch state, execution metadata.
- Batch item: batch ID, subject ID, outcome, skip/failure reason code, processed timestamp.

Do not store identity-card scans, card numbers, or personal document copies. Exact Appwrite TablesDB types, index limits, permission model, and unique constraints must be verified in an isolated project before live migration.

### 6. `scripts/verify-membership-schema.mjs` — new
Read-only checks:
- Exact collection/table existence.
- Every column's key, type, size, required flag, and default.
- Index keys, types, and column order.
- Permissions and uniqueness guarantees.
- Report mismatches; never auto-fix or mutate.

### 7. `functions/moderation/src/admin-membership.js` — new
Admin-only operations:
- Queue pending records.
- Approve pending record.
- Reject pending record with mandatory reason.
- Suspend approved record with mandatory reason.
- Reinstate suspended record with mandatory reason.
- Every state change writes an audit record.
- Verify admin authority server-side from a controlled allowlist or server-owned role source.

The existing `NOX_MODERATOR_USER_IDS` moderator check is not automatically equivalent to permission to approve members. Define a distinct membership-admin permission and least-privilege policy.

### 8. `functions/moderation/src/scheduled-approvals.js` — new
- Persist immutable selected-member snapshot after final confirmation.
- Store execution timestamp normalized to UTC and source timezone `Africa/Cairo`.
- No ordinary cancel action after final confirmation, as requested.
- At execution, re-fetch each member and revalidate pending state and eligibility.
- Skip changed/ineligible records; record reason codes.
- Use idempotency keys and concurrency-safe updates.
- Record batch summary and per-member outcome.

### 9. Browser files
- `core/auth-client.js`: add typed methods for status lookup and registration once server routes exist. Do not treat a client-side value as authoritative.
- `login.html`: after login, call status route; show pending/rejected/suspended/approved view; on lookup failure, do not enter member pages.
- `signup.html`: call registration route only after server implementation; server creates PENDING_REVIEW. Remove language suggesting registration works before it actually does.
- `recovery.html`: password recovery only; never alters membership state.
- Add distinct member-state pages or controlled views, with no sensitive internal moderation notes.

## C. Runtime and dependency preflight

Before changing package files:
- Confirm actual deployed Appwrite Function runtime and build/deploy configuration.
- Resolve package engine mismatch: moderation package `>=22 <23` versus root `>=22 <27`.
- Confirm compatibility of Web SDK `29.0.0` and server SDK `node-appwrite@31.3.0`.
- Confirm supported JWT forwarding and Appwrite TablesDB method signatures against the exact installed SDK versions.
- Do not change Node runtime or dependencies based only on source declarations; runtime changes can trigger rebuild/redeploy.

## D. Test files and mandatory cases

Proposed test location: `functions/moderation/tests/membership/` or repository's existing test convention after inspection.

1. APPROVED member can access member endpoints.
2. PENDING_REVIEW, REJECTED, SUSPENDED, missing, malformed, and unknown state are denied.
3. Membership storage outage fails closed.
4. Tampered client fields `approved`, `role`, `membershipState` do not grant access.
5. Every listed route is covered by a gate test (table-driven test).
6. Admin endpoint rejects non-admin and moderator-only identities without membership-admin permission.
7. Reject/suspend/reinstate require reason.
8. Invalid state transitions are rejected.
9. Concurrent approval attempts produce one valid transition and consistent audit.
10. Scheduled batch retry is idempotent.
11. Batch execution skips members whose state changed after scheduling.
12. One user's request cannot access another user's private resources.
13. Recovery changes credentials only, not membership.
14. Logs never include passwords, JWTs, identity documents, or secret values.

Use synthetic accounts and isolated staging resources only.

## E. Rollout / rollback

1. Read-only verify existing schema and runtime.
2. Create isolated test schema and run migration repeatedly.
3. Deploy server gate to staging only after explicit approval; validate negative tests.
4. Deploy admin/registration/status endpoints to staging.
5. Integrate browser UI.
6. Run full regression and security suite.
7. Production release only after documented go/no-go approval.

Rollback:
- Keep schema additive and retain audit history.
- Roll back to known Function version if necessary under incident procedure.
- Never disable the membership gate globally to restore convenience.
- Fail closed if membership store is unavailable.
- Do not automatically reverse completed membership decisions.

## F. Explicit approval boundary

This document is a proposal. It does not authorize:
- Any source-code modification in `functions/**`.
- Any database/table/column/index/permission change.
- Any Node runtime, dependency, environment, secret, or Function setting change.
- Any deployment or live account action.

Because this branch is associated with an Appwrite Function, backend changes may cause redeployment. Before implementation, show the exact diff and deployment impact and obtain a separate explicit approval. Documentation-only changes are not deployment changes.

## Current disposition

The route inventory and minimal patch proposal are complete. P0 membership enforcement remains a release blocker. No code has been changed and no live Appwrite state has been verified by this proposal.
