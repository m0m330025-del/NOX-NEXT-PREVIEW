# NOX NEXT — Auth & Membership Acceptance Test Catalog
Date: 2026-11-18
Branch: `feature/auth-login-staging`
Status: Documentation / test specification only

## 1. Purpose and release rule

This catalog defines the minimum acceptance, security, privacy, concurrency, and regression checks for browser authentication and membership approval. It is based on an AI engineering review of the repository files and route inventory; it is not a claim that tests have run or that a human engineering team has approved the implementation.

**Release gate:** every P0 test must pass against a staging environment using synthetic accounts before member access is enabled. A test that cannot be executed is **BLOCKED**, not PASS. No production rollout is authorized by this document.

## 2. Test environment and safety

- Use an isolated staging project/environment and synthetic accounts only.
- Never use real identity documents, identity numbers, private contact details, or real people's records as fixtures.
- Do not store identity images or identity-review paperwork in NOX. Any in-person document inspection and paper signature process remains outside the application.
- Do not use real payments, transfers, or valuable balances in acceptance tests. Use mocked providers and non-redeemable test balances.
- Keep API keys, JWTs, passwords, recovery tokens, and personal data out of test output and logs.
- Record build/commit, environment, test runner, timestamp, result, and sanitized evidence for each run.

## 3. Canonical membership states

Allowed canonical values:
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Missing, unknown, malformed, or unrecognized values must fail closed.

Allowed transitions:
- No membership → `PENDING_REVIEW` on registration.
- `PENDING_REVIEW` → `APPROVED` by an authorized administrator.
- `PENDING_REVIEW` → `REJECTED` by an authorized administrator with a mandatory reason.
- `APPROVED` → `SUSPENDED` by an authorized administrator with a reason.
- `SUSPENDED` → `APPROVED` only through an explicit authorized reinstatement action.
- `REJECTED` remains denied; reconsideration must be a separate audited workflow.

A valid login session does not imply membership approval.

## 4. Priority definitions

- **P0 — Release blocker:** authentication bypass, unauthorized member access, privilege escalation, cross-user data exposure, or unsafe approval transition.
- **P1 — Required:** core workflow, auditability, privacy, recovery, concurrency, and reliable error handling.
- **P2 — Quality:** usability, accessibility, and non-security edge cases.

## 5. Browser authentication acceptance tests

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| AUTH-001 | P0 | Valid synthetic credentials for a pending member | Authentication may identify the account, but member pages and member APIs remain denied; pending state is shown clearly. |
| AUTH-002 | P0 | Valid credentials for an approved synthetic member | Member access is granted only after the server confirms current `APPROVED` state. |
| AUTH-003 | P0 | Valid credentials for rejected or suspended member | Member access is denied regardless of an existing or newly created session. |
| AUTH-004 | P0 | Missing, malformed, or unknown membership state | Deny by default; do not infer approval. |
| AUTH-005 | P0 | Modify localStorage, sessionStorage, URL parameters, DOM, or client JavaScript to claim approval | No access change; server state remains authoritative. |
| AUTH-006 | P0 | Send a direct request to a member API without a session | Return an unauthenticated response; no protected data is returned. |
| AUTH-007 | P0 | Send a direct request with a valid session but pending/rejected/suspended membership | Return a denied response; no protected data is returned. |
| AUTH-008 | P0 | Change membership state after a session has been issued | Next protected request rechecks current server-side state and denies access if no longer approved. |
| AUTH-009 | P1 | Successful login followed by account lookup failure | Session cleanup is attempted; UI does not display a false successful authenticated state. |
| AUTH-010 | P1 | Logout | Current session is invalidated server-side; protected requests subsequently fail. |
| AUTH-011 | P1 | Password recovery with invalid, expired, reused, or mismatched token | Recovery is rejected safely without exposing account existence or secrets. |
| AUTH-012 | P1 | Signup form age field or browser-side validation is bypassed | Server-side eligibility policy remains authoritative; client-only checks are not treated as security controls. |
| AUTH-013 | P1 | Refresh or open a member URL in a new tab | Server-side membership gate is applied on every protected resource load. |
| AUTH-014 | P2 | Keyboard-only navigation and screen-reader labels on login/recovery | Controls are reachable and have meaningful accessible names and error announcements. |

## 6. Route-level authorization matrix

All routes below are treated as protected member routes unless a separately reviewed public contract explicitly says otherwise. Authorization must be enforced inside the server handler, not only by hiding browser UI.

| Route | P0/P1 checks |
|---|---|
| `GET /friends/lookup` | Approved membership required; validate query; prevent enumeration and rate abuse. |
| `GET /notifications` | Approved membership required; return only the caller's notifications. |
| `POST /notifications/read` | Approved membership required; only mark caller-owned notifications. |
| `POST /friends/requests` | Approved membership required; sender derived from authenticated identity, not request body. |
| `GET /friends/requests` | Approved membership required; return only requests involving caller. |
| `POST /friends/requests/respond` | Approved membership required; only recipient may respond; validate state transition. |
| `POST /friends/requests/cancel` | Approved membership required; only requester may cancel. |
| `GET /friends` | Approved membership required; return only caller's authorized friend list. |
| `GET /conversations` | Approved membership required; only conversations caller belongs to. |
| `POST /conversations` | Approved membership required; validate participants and prevent unauthorized membership injection. |
| `GET /messages` | Approved membership required; verify caller belongs to requested conversation before returning messages. |
| `POST /messages` | Approved membership required; verify conversation membership and validate content/limits. |
| `POST /reports` | Approved membership required unless a documented abuse-report exception is deliberately approved; never trust reporter identity from body. |
| `GET /reports` | Do not expose all reports to ordinary members. Define whether this is moderator-only or caller-owned reports, then enforce that exact policy. |
| `POST /blocks` | Approved membership required; actor identity from authenticated session; validate target and self-block rules. |
| `DELETE /blocks` | Approved membership required; only caller may remove their own block. |
| `GET /blocks` | Approved membership required; return only caller's block list. |
| `/moderation...` | Moderator role must be server-derived from an authoritative allowlist/role source; ordinary member access denied. Unimplemented routes must remain explicitly unavailable, not imply success. |

For every route, test: no session, pending, rejected, suspended, approved, malformed state, wrong owner, forged actor ID, invalid payload, repeated request, and unexpected storage failure.

## 7. Administrator approval workflow tests

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| ADM-001 | P0 | Non-admin attempts to open or call admin review functions | Denied server-side. |
| ADM-002 | P0 | Admin approves a pending synthetic member | State changes once to `APPROVED`; actor, target, time, and action are audited. |
| ADM-003 | P0 | Admin rejects a pending member without a reason | Rejected; validation error; no state change. |
| ADM-004 | P0 | Admin suspends an approved member without a reason | Rejected; no state change. |
| ADM-005 | P0 | Attempt invalid transition, such as rejected → approved through ordinary approval endpoint | Denied; use a separately authorized reconsideration workflow if later designed. |
| ADM-006 | P0 | Replay or duplicate approval action | Idempotent outcome; no duplicate side effects or duplicate audit events that misrepresent actions. |
| ADM-007 | P1 | Admin opens review queue | Show only minimum required application fields: display name, NOX ID, request date, state, and review actions. |
| ADM-008 | P1 | Review queue or audit logs are inspected for identity documents | No identity document, identity number, or paper-signature image is present. |
| ADM-009 | P1 | Admin session expires during review | Action is denied; no partial state update. |
| ADM-010 | P1 | Two admins act on the same request concurrently | One valid transition wins; the other receives a conflict/current-state response; audit history remains consistent. |

## 8. Scheduled bulk approval tests

The approved design includes selecting a reviewed group, previewing the exact members, and scheduling a single bulk approval at Cairo local time. Final confirmation is not cancellable by the ordinary UI, but execution must still revalidate eligibility.

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| BULK-001 | P0 | Schedule selected pending members | Persist an immutable snapshot of target IDs, scheduler identity, requested Cairo date/time, and schedule metadata. |
| BULK-002 | P0 | Preview before final confirmation | Display exact names, NOX IDs, and count; confirmation is blocked if preview and submitted selection differ. |
| BULK-003 | P0 | Client changes target IDs or execution time after confirmation | Server rejects tampered payload; persisted schedule remains authoritative. |
| BULK-004 | P0 | Scheduled execution time arrives | Execute according to the persisted schedule and explicit Cairo timezone handling, not the browser's local timezone. |
| BULK-005 | P0 | A selected member is no longer pending at execution | Skip that member; do not overwrite the newer state; record sanitized skip reason. |
| BULK-006 | P0 | A selected account is suspended, rejected, missing, or otherwise ineligible at execution | Skip safely and record the outcome; do not approve. |
| BULK-007 | P0 | Scheduler retries after timeout or duplicate delivery | Idempotent execution; no duplicate approvals or inconsistent audit records. |
| BULK-008 | P1 | Some members succeed and others fail | Per-member outcome recorded; successful transitions remain valid; failures are visible to authorized admins. |
| BULK-009 | P1 | Daylight-saving/timezone boundary | Stored instant and displayed Cairo time remain unambiguous and correct. |
| BULK-010 | P1 | Schedule is created by a non-admin or altered by a non-admin | Denied server-side. |
| BULK-011 | P1 | Very large selected group | Enforce documented batch limits, pagination/queue behavior, and bounded execution time. |
| BULK-012 | P1 | Audit schedule is reviewed | Record creator, confirmation time, intended execution time, target snapshot, per-member result, and execution identity. |

## 9. Data ownership and privacy tests

- A member cannot read, update, delete, or enumerate another member's private profile, notifications, friend requests, conversations, messages, or blocks.
- Every owner/participant identifier used for authorization is derived or cross-checked server-side.
- NOX ID is an identifier, not a credential or authorization secret.
- Do not log passwords, session/JWT/recovery tokens, moderation keys, identity documents, identity numbers, or unnecessary message contents.
- Error messages do not disclose whether an unrelated account exists.
- Retention and deletion behavior is documented for reports, moderation records, and account closure before release.
- Test exports, diagnostics, and backups do not accidentally include secrets or identity paperwork.

## 10. Concurrency, resilience, and abuse tests

- Simultaneous friend-request creation does not create duplicate active requests.
- Simultaneous accept/decline/cancel operations produce one valid final state.
- Concurrent message writes preserve ordering metadata and do not cross conversation boundaries.
- Rate limits apply to login attempts, recovery requests, friend lookup, reports, and other abuse-prone routes.
- Invalid JSON, oversized payloads, missing fields, unexpected content types, and storage outages fail safely.
- Retryable failures do not duplicate non-idempotent actions.
- All server-side validation is repeated even when browser validation exists.

## 11. Schema and runtime preflight

Before any implementation or deployment, verify in the actual staging project:

1. Every required collection/table and attribute exists with the expected type, size, required flag, default, and index.
2. Existing attributes are not accepted merely because their names match; compare their full definitions.
3. Indexes support every owner, participant, state, and scheduled-execution query.
4. Database permissions prevent client-side writes to privileged membership and role fields.
5. Function runtime, package engine ranges, SDK versions, and deployed runtime are mutually compatible.
6. Root and function dependency lockfiles are present and reproducible.
7. The deployed function's authentication/JWT validation behavior is tested with real staging configuration and synthetic accounts.
8. Any Appwrite-specific account/session disabling behavior is verified against the deployed Appwrite version before relying on it.

## 12. Evidence template

For each test, capture:

- Test ID and priority
- Commit SHA and deployment/build identifier
- Environment identifier (never secrets)
- Synthetic fixture IDs
- Preconditions
- Exact request/action performed
- Expected result
- Actual result
- PASS / FAIL / BLOCKED
- Sanitized response/status and relevant audit event IDs
- Tester and timestamp

## 13. Exit criteria

A staging release candidate is eligible for a separate release review only when:

- All P0 tests pass.
- All P1 tests pass or have explicitly documented, risk-accepted exceptions.
- No member route bypasses the server-side membership gate.
- Cross-user access tests pass.
- Admin actions and scheduled approvals are authenticated, authorized, idempotent, and audited.
- Schema/runtime preflight is complete.
- No secrets or identity paperwork are present in source, logs, fixtures, or test evidence.
- Rollback and incident response procedures are documented and rehearsed.

## 14. Current execution status

**Specification created; tests not executed.** This document does not change application code, database schema, Appwrite configuration, secrets, runtime, or deployment. It does not grant approval to deploy or enable member access.
