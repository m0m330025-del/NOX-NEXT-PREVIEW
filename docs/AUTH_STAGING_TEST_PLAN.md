# NOX NEXT — Browser Authentication and Approval Test Plan

**Status:** Test plan; execution against live services not performed  
**Date:** 2026-11-18

## Test constraints

- Use synthetic test identities only.
- Never use real member passwords, identity documents, or personal contact data.
- Do not create or activate real accounts as part of staging preparation.
- Tests requiring Appwrite or deployed backend access remain pending until explicitly authorized and configured.

## Authentication tests

- Valid synthetic credentials establish only the expected authentication session.
- Invalid credentials and unknown email produce non-enumerating errors.
- Expired or deleted sessions are denied.
- Logout deletes the current session and clears local UI state.
- Password recovery works only through allowlisted origins and configured sender settings.
- Rate limits apply to login, registration, and recovery.

## State/access tests

For each canonical state — `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED` — verify:
- Page navigation result.
- Direct URL access result.
- Protected API result.
- Protected data read/write result.
- Refresh behavior.
- Session renewal behavior.

Expected result:
- Only `APPROVED` may pass the membership gate.
- Pending, rejected, suspended, missing, malformed, stale, and unknown states are denied.
- Resource-level authorization still applies to approved accounts.

## Tampering and authorization tests

- Changing localStorage/sessionStorage does not alter server state.
- Adding `approved=true`, role, state, or NOX ID to URL/body does not grant access.
- Ordinary member credentials cannot call admin endpoints.
- Admin endpoints reject missing/expired sessions and unauthorized roles.
- A member cannot read another member's private data by changing an identifier.
- Every state-changing action emits the expected audit event.

## State-transition tests

- Only transitions in `REGISTRATION_STATE_MACHINE.md` are accepted.
- All other transitions are rejected.
- Rejection requires a reason.
- Concurrent decisions cannot silently overwrite state.
- Duplicate submissions do not create duplicate decisions or audit events.

## Scheduled batch tests

- Snapshot member list/count/timezone matches the final confirmation.
- Date/time is interpreted in `Africa/Cairo`.
- Browser closure does not stop server-side execution.
- Duplicate scheduler delivery does not duplicate approvals.
- Concurrent workers cannot execute the same batch twice.
- Each member is revalidated at execution time.
- Changed/ineligible records are skipped and audited.
- No admin cancel control exists after final confirmation, but ineligible records are never force-approved.

## Release blockers to verify

- Exact Appwrite Cloud and SDK behavior for disabled accounts and sessions.
- Browser hostname/platform allowlist and CORS.
- Database bootstrap completion and authoritative membership schema.
- Node runtime/package engine compatibility.
- Server-side rate limiting and audit persistence.
- End-to-end tests in an isolated staging environment.

## Result recording template

For each test, record: test ID, build/commit, synthetic account fixture, expected result, actual result, pass/fail, timestamp, and sanitized logs. Do not store passwords or tokens in test reports.
