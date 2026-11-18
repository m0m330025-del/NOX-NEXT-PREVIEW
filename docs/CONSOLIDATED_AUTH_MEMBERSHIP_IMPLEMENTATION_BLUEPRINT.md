# NOX NEXT — Consolidated Authentication & Membership Implementation Blueprint

**Date:** 2026-11-18  
**Branch:** `feature/auth-login-staging`  
**Status:** Engineering implementation blueprint; documentation only  
**Review basis:** Multi-discipline AI review; not human engineering sign-off

## 1. Executive decision

The recommended design is a **server-authoritative membership gate** in front of every member feature. Appwrite credential authentication proves account control; it does not prove membership approval.

The current reviewed branch is not ready for member launch. The browser login helper can establish an Appwrite session, but the reviewed Function request path does not enforce the canonical membership states. The registration page remains a preview, and the moderation route is not an implemented membership administration API.

**Release status: HOLD.** Implement the server-side gate and tests before enabling member pages or data.

## 2. Canonical state model

Use only these exact values:

- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Unknown, missing, malformed, or stale states must deny access.

Allowed transitions:

| Previous state | New state | Authorized actor | Required data |
|---|---|---|---|
| No membership | `PENDING_REVIEW` | Registration service | Server-generated request ID and timestamp |
| `PENDING_REVIEW` | `APPROVED` | Authorized admin | Actor, timestamp, audit outcome |
| `PENDING_REVIEW` | `REJECTED` | Authorized admin | Mandatory user-facing reason/category, internal note separate |
| `APPROVED` | `SUSPENDED` | Authorized admin | Reason/category and audit event |
| `SUSPENDED` | `APPROVED` | Authorized admin | Explicit reinstatement reason and audit event |

All other transitions are denied. Rejected applications remain denied; any reconsideration must be a separate, explicitly audited administrative process.

## 3. Proposed data model (not yet applied)

The following is a logical model. Final Appwrite TablesDB column types, sizes, indexes, permissions, and transaction semantics must be verified against the actual target database before any migration.

### 3.1 Membership record

Recommended table: `memberships`

| Field | Purpose | Rule |
|---|---|---|
| `authUserId` | Appwrite account ID | Required; unique |
| `noxId` | Public NOX identifier | Required; unique after normalization |
| `displayName` | Member display name | Minimum necessary profile data |
| `state` | Canonical membership state | Required; server-written only |
| `requestedAt` | Submission time | Server-generated UTC timestamp |
| `reviewedAt` | Last decision time | Server-generated |
| `reviewedBy` | Admin account ID | Server-derived from verified session |
| `rejectionReasonCode` | Approved reason category | Required for rejection |
| `userMessage` | Sanitized user-facing rejection message | Separate from internal note |
| `internalNote` | Restricted admin-only note | Never returned to member |
| `createdAt`, `updatedAt` | Lifecycle timestamps | Server-generated |

Do not store identity-card images, full identity numbers, or paper signatures. The owner reviews those outside NOX, as previously specified.

### 3.2 Audit records

Recommended table: `membership_audit`

Fields: actor ID, target account ID, previous state, new state, action type, reason/category, batch ID if applicable, timestamp, outcome, and a correlation/request ID.

Audit rows must be append-only from application workflows. Admin UI must not provide an edit/delete action. Access to audit data is restricted to authorized administrators.

### 3.3 Scheduled approval batches

Recommended table: `membership_approval_batches`

Fields: batch ID, creator admin ID, immutable selected membership IDs, selected NOX IDs/display-name snapshot, selected count, scheduled UTC timestamp, original `Africa/Cairo` local timestamp, timezone identifier, status, idempotency key, execution timestamps, and summary counts.

Recommended child table: `membership_approval_batch_items`

Fields: batch ID, membership ID, expected state, per-member outcome (`APPROVED`, `SKIPPED`, `FAILED`), reason code, processed timestamp, and audit correlation ID.

The selected snapshot is immutable after final confirmation. At execution, every member is revalidated. A committed schedule never force-approves an ineligible or changed record.

## 4. Server API contract

Route names below are proposed contracts, not existing deployed endpoints.

### Member-facing routes

- `GET /membership/status`: authenticate caller from verified Appwrite session; return only state and safe user-facing message.
- Protected member routes: call the same membership authorization guard before reading or writing member data.
- `POST /membership/requests`: create a pending request using server-controlled state; reject client-supplied state, role, reviewedBy, approval flags, or timestamps.

### Administrator routes

- `GET /admin/membership/requests`: paginated queue; admin authorization required.
- `POST /admin/membership/{id}/approve`: conditional transition from `PENDING_REVIEW` to `APPROVED`.
- `POST /admin/membership/{id}/reject`: mandatory reason; separate internal note and safe user-facing message.
- `POST /admin/membership/{id}/suspend`: conditional transition from `APPROVED` to `SUSPENDED`.
- `POST /admin/membership/{id}/reinstate`: explicit conditional transition from `SUSPENDED` to `APPROVED`.
- `POST /admin/membership/batches`: create a scheduled immutable snapshot after final confirmation.
- `GET /admin/membership/batches/{id}`: inspect schedule and per-member outcomes.

Every admin route must independently verify the caller's session and administrator authority on the server. A browser role, hidden button, NOX ID, or request-body actor ID is never authorization.

## 5. Shared authorization guard

Every member endpoint must follow this order:

1. Verify Appwrite session/JWT with the trusted server-side Appwrite API.
2. Derive `authUserId` only from the verified identity.
3. Load the authoritative membership record using that ID.
4. Reject if record missing or state is not exactly `APPROVED`.
5. Apply resource-level authorization (ownership, friendship, conversation membership, etc.).
6. Perform the requested operation.
7. Return only the minimum data needed.

This guard must be applied to existing friend, notification, conversation, message, report, block, and every future member route. Page redirects are not a security boundary.

## 6. Browser behavior

- Login success means credentials were accepted; it does not mean membership was approved.
- After login, query the trusted status endpoint.
- `APPROVED`: route to member home only after the server confirms the state.
- `PENDING_REVIEW`: show the pending status screen; no member API/data.
- `REJECTED`: show a safe rejection message only; no internal notes.
- `SUSPENDED`: show restricted status screen; no member API/data.
- Missing/unknown state or status-service error: fail closed and show a retry-safe generic message.
- Signup creates only a pending request; browser cannot select state.
- Recovery redirects must use configured allowlisted origins.
- Logout deletes the current Appwrite session and clears transient UI state.
- Never use localStorage/sessionStorage as the authority for state or role.

## 7. Individual admin workflow

The queue shows name, NOX ID, request date, state, and available actions.

Approval:
- Only for records currently in `PENDING_REVIEW`.
- Use an expected-state conditional update.
- Record audit metadata.

Rejection:
- Reason is mandatory.
- Keep internal notes separate from the sanitized member-facing message.
- Record audit metadata.

Conflicts:
- If the record changed since the admin loaded it, do not overwrite it.
- Return a conflict result and refresh the queue.
- Duplicate submissions must be idempotent and must not create duplicate decisions.

## 8. Scheduled bulk approval workflow

This follows the product decision already specified:

1. Admin selects only reviewed pending requests.
2. UI displays exact names, NOX IDs, total count, scheduled date/time, and `Africa/Cairo` timezone.
3. Final confirmation creates a committed immutable batch snapshot.
4. There is no cancel control after final confirmation.
5. A trusted server scheduler executes the batch; a browser tab is not responsible for execution.
6. Each selected member is re-read at execution time.
7. Only members still in `PENDING_REVIEW` and otherwise eligible are approved.
8. Changed or ineligible members are marked skipped and audited.
9. Per-member outcomes and aggregate counts are visible to authorized admins.
10. Idempotency and worker concurrency controls prevent duplicate execution.

The no-cancel UI decision never overrides state revalidation or safety checks. Use UTC for persisted execution instants and retain `Africa/Cairo` for display and scheduling interpretation; verify daylight-saving behavior in tests.

## 9. Migration and deployment sequence

Do not apply any of these steps until a separately approved change set is prepared.

### Phase A — preflight
- Confirm exact Appwrite project, database, Function, deployed runtime, and branch-to-deployment relationship.
- Verify the deployed Node runtime against package engine declarations.
- Verify the pinned `node-appwrite` API signatures and Appwrite TablesDB transaction behavior.
- Export or snapshot the staging schema/data where supported.
- Confirm test environment isolation and rollback access.

### Phase B — schema
- Add membership, audit, and batch tables/columns/indexes in an isolated staging environment.
- Make migration idempotent.
- Verify existing column definitions, not just column names.
- Define unique constraints for account ID, NOX ID, and idempotency keys.
- Confirm least-privilege table permissions.

### Phase C — backend gate
- Implement shared authentication and membership guard.
- Add it to every member route before other data operations.
- Add protected admin authorization and conditional transition service.
- Add audit persistence.
- Keep all unknown/missing states denied.

### Phase D — browser integration
- Connect login to the trusted status endpoint.
- Add state-specific screens.
- Connect registration to a pending-only request workflow.
- Verify recovery, logout, session refresh, and browser origins.

### Phase E — scheduled batch
- Implement server-side scheduler and immutable batch records.
- Add idempotency, concurrency control, revalidation, and per-member outcomes.
- Test Cairo timezone and daylight-saving transitions.

### Phase F — release gate
- Run all synthetic tests in isolated staging.
- Obtain human engineering/security review.
- Confirm logs contain no credentials, JWTs, secrets, or identity documents.
- Release only after every P0 blocker passes.

## 10. Rollback strategy

- Take a verified staging backup/snapshot before schema changes.
- Prefer additive schema migrations first; do not destructively rename/drop columns during the first release.
- Keep the previous Function deployment/version available for rollback where Appwrite deployment controls permit.
- If authorization tests fail, disable member feature access rather than bypassing the membership gate.
- Do not downgrade approved/pending/rejected states automatically during rollback.
- Preserve audit records; do not delete them to make rollback easier.
- Define a forward-fix path for partially executed scheduled batches; never blindly replay without checking per-member outcomes.

Exact rollback commands and Appwrite console steps must be prepared only after the actual deployment topology and migration method are verified.

## 11. Security and QA acceptance criteria

All tests use synthetic identities only.

### P0
- No non-approved account can access any member page, API, or data.
- Missing/unknown/malformed state denies access.
- Client-supplied approval, role, NOX ID, or local storage cannot grant access.
- Every member route uses the shared server guard.
- Admin operations reject non-admin callers.
- State transitions are conditional, audited, and idempotent.
- Rejection reason is mandatory.
- No identity documents or full identity numbers are stored.

### P1
- Login/recovery/registration rate limits are effective.
- Session expiry, logout, refresh, and recovery are tested.
- Batch snapshot is immutable after confirmation.
- Duplicate scheduler execution does not duplicate approvals.
- Each batch member is revalidated at execution.
- Cairo timezone and daylight-saving cases pass.
- Audit and application logs do not contain secrets or tokens.

### P2
- Mobile and desktop layouts work.
- Keyboard navigation, focus indicators, semantic labels, and contrast pass accessibility checks.
- Loading, empty, error, conflict, and retry states are understandable.

## 12. Known unresolved verification items

1. Exact deployed Appwrite behavior for disabled accounts, session creation, and re-enablement.
2. Actual live schema and current table/column/index permissions.
3. Node runtime mismatch previously observed between the moderation package and deployed Function.
4. Exact browser hostnames, Appwrite platform allowlist, CORS, and recovery redirects.
5. Whether the deployed Function has sufficient execution/scheduling support for the batch scheduler; do not assume it does.
6. Exact Appwrite TablesDB transaction/conditional-update guarantees for the chosen concurrency design.

These are verification tasks, not assumptions. No live integration test has been run by this document.

## 13. Implementation authorization boundary

This file is a plan only. It does not change application source, database schema, Appwrite settings, Function code, runtime, secrets, accounts, or deployment.

The branch is associated with an Appwrite Function. Backend, schema, runtime, secret, and Function changes may trigger redeployment. Before those changes, present the exact files/settings, migration and rollback plan, and deployment impact for explicit approval.

**Final engineering recommendation:** implement the membership gate first, then the individual admin decisions, then browser status integration, and only then scheduled bulk approval. Do not launch member access before the P0 acceptance criteria pass.
