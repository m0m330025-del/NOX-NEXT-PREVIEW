# NOX NEXT — Auth & Membership File-by-File Execution Plan
Date: 2026-11-18
Branch reference: `feature/auth-login-staging`
Status: planning document only — no application, backend, database, runtime, secret, or deployment changes made.

## 1. Engineering decision

Proceed in small, reviewable stages. The browser remains the user-facing entry point, but membership authorization must be enforced by the server. A successful Appwrite email/password login is authentication only; it is not proof of membership approval.

This plan is a technical planning artifact reviewed by AI. It is not approval by human engineers, a live security audit, or evidence that any proposed endpoint/schema exists in the deployed Appwrite project.

## 2. Scope boundary

### Included in this plan
- Exact responsibilities for the expected frontend and Function files.
- Proposed new migration, membership service, admin workflow, and test files.
- Safe rollout order, acceptance criteria, and rollback strategy.
- Synthetic-only test data and privacy constraints.

### Not performed or authorized by this document
- No edits to `functions/**`, frontend runtime files, package manifests, Appwrite collections/attributes, Function settings, environment variables, secrets, or deployment configuration.
- No Appwrite Console access, live endpoint verification, account creation, approval, or production test.
- No collection or storage of identity-card images/numbers. Any in-person document review and paper signing remain outside the application; the app stores only the minimum decision/audit metadata required for its operation.

Because this repository branch is associated with an Appwrite Function, a backend commit may trigger a deployment. Any implementation stage touching backend source, schema, runtime, Function configuration, or deployment requires a separate, informed approval after the exact diff and redeployment risk are presented.

## 3. File-by-file change map

The paths below distinguish previously reviewed files from proposed files. Confirm actual repository layout and current contents immediately before implementation; do not create duplicate services or migrations if equivalent files already exist.

| File / path | Status | Planned responsibility |
|---|---|---|
| `login.html` | Existing, reviewed | Keep browser login; after authentication, request authoritative membership status and route only to the correct state screen. Never infer approval from local storage or URL parameters. |
| `signup.html` | Existing, reviewed | Replace preview-only behavior with a registration request only after server registration contract is implemented. Client-side age checks are UX only and cannot be the security boundary. |
| `recovery.html` | Existing, reviewed | Preserve password-recovery flow; ensure recovery does not grant membership access. |
| `core/auth-client.js` | Existing, reviewed | Keep Appwrite session primitives; add narrowly scoped status/registration client methods only after server contracts exist. Handle expired sessions and status lookup failures fail-closed. |
| `core/appwrite-config.js` | Existing, reviewed | Keep only public endpoint/project/database identifiers. No API keys or privileged secrets in browser code. |
| `functions/moderation/src/index.js` | Existing, reviewed | Add shared server-side authentication + membership authorization before every member-only route. Protect admin routes separately. |
| `functions/moderation/src/store.js` | Existing, reviewed | Add persistence operations for membership, audit events, and scheduled batches with explicit authorization at the route/service boundary. Avoid trusting client-supplied role/status. |
| `functions/moderation/src/membership-service.js` | Proposed | Centralize state validation, allowed transitions, eligibility checks, and fail-closed behavior. |
| `functions/moderation/src/auth-guards.js` | Proposed | Centralize Appwrite JWT verification, account identity resolution, member gate, and admin authorization. Do not duplicate subtly different checks across routes. |
| `functions/moderation/src/admin-membership.js` | Proposed | Implement individually authorized approve/reject/suspend/reinstate operations, mandatory rejection/suspension reason, and audit recording. |
| `functions/moderation/src/scheduled-approvals.js` | Proposed | Implement immutable scheduled batch snapshot, Cairo-time execution, revalidation, idempotency, and per-member outcome recording. |
| `scripts/migrations/NNN_membership_schema.mjs` | Proposed | Additive, repeatable schema migration for membership, audit, and scheduled batch data. Exact collection/attribute IDs and constraints must be verified against the live Appwrite project before execution. |
| `scripts/verify-membership-schema.mjs` | Proposed | Read-only schema verification that checks attribute names, types, sizes, required flags, indexes, and collection permissions; do not silently accept a same-name attribute with the wrong type. |
| `tests/auth-membership/` | Proposed | Synthetic integration/security tests for all states, endpoint gates, tampering, admin authorization, concurrency, and scheduled execution. |
| `docs/RELEASE_AUTH_MEMBERSHIP_CHECKLIST.md` | Proposed | Human-readable release gate with evidence links, rollback owner, and explicit go/no-go decision. |

## 4. Canonical membership model

Allowed states:
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Missing, unknown, malformed, or unreadable status must deny member access.

Allowed transitions:
- New registration → `PENDING_REVIEW`
- `PENDING_REVIEW` → `APPROVED` by authorized admin
- `PENDING_REVIEW` → `REJECTED` by authorized admin with mandatory reason
- `APPROVED` → `SUSPENDED` by authorized admin with reason
- `SUSPENDED` → `APPROVED` only through explicit authorized reinstatement
- `REJECTED` remains denied; reconsideration must be a separate audited workflow

A login session is not membership approval. A member-only route must check both authenticated identity and current server-side membership state on every request. Object-level authorization must also ensure the user can access the specific record/resource.

## 5. Required API behavior (contracts to implement, not live endpoints)

- Registration: create/associate the account's membership record as `PENDING_REVIEW`; reject duplicate or conflicting membership records safely.
- Status: return only the authenticated user's canonical membership state and safe UI metadata.
- Member APIs: reject all states other than `APPROVED`; unknown state and database lookup failure deny access.
- Admin queue: require an independently verified admin identity/role; return only fields needed for review (display name, NOX ID, submission time, state).
- Approve: accept a target account reference, validate current state, write state change and audit record atomically where supported.
- Reject: require a non-empty reason; validate state; write audit record.
- Suspend/reinstate: require reason and explicit action; write audit record.
- Batch schedule: accept selected eligible records and a Cairo-local execution time; persist an immutable snapshot and actor/audit metadata. Never accept client-supplied claims that a person was verified.

All mutating admin operations must be server-authorized, validated, rate-limited where appropriate, and auditable. Never accept `approved`, `role`, `membershipState`, or admin identity as trusted client input.

## 6. Scheduled bulk approval safeguards

The agreed workflow is:
1. Admin selects a set of pending members.
2. UI displays names, NOX IDs, and total count for final review.
3. Admin sets the date and time in `Africa/Cairo`.
4. Final confirmation stores an immutable selection snapshot and schedule.
5. There is no cancel control after final confirmation, per the stated product requirement.
6. At execution time, the server re-reads each member and revalidates that the record is still eligible.
7. Ineligible, changed, missing, or already-processed records are skipped safely and receive a recorded outcome.
8. Each member operation is idempotent; retries cannot approve twice or corrupt audit history.
9. The batch records scheduled time, actual execution time, initiating admin, snapshot, counts, and per-member outcomes.

The no-cancel product decision does not override safety: an authorized emergency pause/disable mechanism may be required operationally and must be separately designed, documented, and access-controlled before production.

## 7. Implementation sequence and gates

### Stage A — preflight (read-only)
- Re-fetch the branch and confirm the files/SHAs.
- Verify deployed Appwrite Function runtime, SDK versions, endpoint routing, JWT behavior, collection permissions, and current schema from authorized project access.
- Resolve the known runtime mismatch: moderation package previously declared Node `>=22 <23`, while the Function was reported as Node 26.
- Verify Appwrite Web SDK and server SDK compatibility.
- Record current deployment version and rollback procedure.

**Gate A:** no implementation until preflight facts are recorded and a backend-change approval is obtained.

### Stage B — schema and migration
- Write an additive migration and read-only verifier.
- Test migration against an isolated test project/database first.
- Verify indexes, permissions, required fields, and type/size constraints.
- Prove rerunning the migration is safe.

**Gate B:** no production schema change without a reviewed diff, backup/restore plan, and explicit approval.

### Stage C — server authorization
- Implement shared authentication and membership guards.
- Apply the guard to every member-only endpoint, including messages, conversations, friends, notifications, reports, and blocks.
- Protect admin endpoints with a separate server-side admin allowlist/role check.
- Ensure authorization is checked before data is read or changed.

**Gate C:** automated negative tests prove pending/rejected/suspended/unknown states cannot access any member endpoint.

### Stage D — admin workflow
- Implement queue, individual decisions, mandatory reasons, audit trail, and immutable scheduled batches.
- Add concurrency control and idempotency.
- Ensure the browser cannot grant itself admin privileges.

**Gate D:** unauthorized-admin and race-condition tests pass.

### Stage E — browser integration
- Connect signup to server-side pending registration.
- Connect login to authoritative status routing.
- Add pending, rejected, suspended, and approved screens.
- Ensure password recovery does not change membership state.
- Remove misleading success messages where server state is not confirmed.

**Gate E:** client tampering tests cannot bypass server authorization.

### Stage F — release validation
- Run all tests with synthetic accounts only.
- Verify logs contain no passwords, tokens, identity documents, or unnecessary personal data.
- Perform a controlled staging rollout and observe errors/latency.
- Obtain an explicit release go/no-go review.

**Gate F:** production release remains blocked until all P0/P1 checks pass and a human owner approves.

## 8. Minimum acceptance test matrix

| Scenario | Expected result |
|---|---|
| Valid login, `APPROVED` membership | Member UI available; each API still enforces server gate |
| Valid login, `PENDING_REVIEW` | Pending screen; all member APIs denied |
| `REJECTED` membership | Rejected screen; all member APIs denied |
| `SUSPENDED` membership | Suspended screen; all member APIs denied |
| Missing/unknown/malformed membership | Fail closed; no member data returned |
| Client changes local storage/URL/request body to claim approval | No effect; server denies |
| Non-admin calls admin endpoint | Denied and security event recorded |
| Admin rejects without reason | Validation error; no state change |
| Scheduled batch encounters changed state | Member skipped and outcome recorded |
| Scheduled batch retries | Idempotent; no duplicate approval/audit mutation |
| User A requests User B's private resource | Denied unless explicit resource policy allows it |
| Membership datastore unavailable | Fail closed for protected operations |
| Password recovery completes | Password changes; membership state unchanged |

## 9. Rollback strategy

- Keep schema changes additive; do not destructively rename/drop existing fields during the first rollout.
- Deploy server code with a tested rollback artifact/version.
- If the gate causes unexpected denial, rollback the Function version only under the approved incident procedure; do not disable authorization globally as a quick fix.
- Preserve audit records and scheduled-batch outcomes.
- Do not reverse completed membership decisions automatically during rollback.
- Any emergency bypass must be time-limited, admin-controlled, logged, and separately approved; preferred behavior is to keep access denied rather than fail open.

## 10. Known blockers from the prior review

- Membership schema was not confirmed/applied.
- Existing member endpoints lacked a confirmed universal membership-state gate.
- Signup page was a preview and client-only checks are bypassable.
- Moderation route previously returned `501 not_implemented`.
- Function runtime/package engine declarations were mismatched.
- No live integration test evidence was available.
- Existing tests did not cover wallet/gift/jewel concurrency; those features remain outside this auth package and need their own ledger/concurrency review before any real balances are enabled.

## 11. Final status

This file is a planning document only. It does not implement authentication, membership approval, schema, admin workflows, or scheduled execution. It does not prove production readiness. The next safe engineering action is a read-only preflight and exact diff proposal; any backend/schema/runtime/deployment change remains behind a separate explicit approval gate.
