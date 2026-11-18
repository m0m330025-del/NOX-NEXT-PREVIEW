# NOX NEXT — AI Engineering Review: Registration States and Access Rules

**Date:** 2026-11-18  
**Review type:** AI-assisted documentation/security consistency review; not a human engineering sign-off  
**Reviewed branch:** `feature/auth-login-staging`

## Overall result

**Decision: APPROVE THE REQUIREMENTS WITH DOCUMENTATION FIXES BEFORE IMPLEMENTATION.**

The four-state model and fail-closed access rule are sound as product requirements. The documents are not yet fully implementation-ready because of naming and lifecycle details listed below. No application code, schema, Function, Appwrite setting, secret, or deployment was changed.

## Findings

### 1. State-name mismatch — must fix

- `REGISTRATION_STATES_AND_ACCESS_RULES.md` uses uppercase values: `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`.
- The older integration plan uses lowercase values: `pending_review`, `approved`, `rejected`, and mentions suspended in tests.
- **Recommendation:** use the uppercase values from the newer state document as the single canonical enum everywhere, including API responses, database values, tests, and UI mapping. Do not silently accept alternate spellings.

### 2. Explicit transition rules — add before implementation

Recommended transitions:
- New application → `PENDING_REVIEW`.
- `PENDING_REVIEW` → `APPROVED` or `REJECTED`, by an authorized administrator only.
- `APPROVED` → `SUSPENDED`, by an authorized administrator only.
- `SUSPENDED` → `APPROVED` only after an explicit authorized reinstatement decision.
- `REJECTED` remains denied; any reconsideration should be a separately audited administrative process, not a client-side status edit.
- All other transitions are denied by default.

### 3. Authentication is separate from membership approval

The Appwrite session proves authentication, not membership approval. Every protected server endpoint and protected data access must verify the session and authoritative state. A browser route guard is useful for navigation only and is never a security boundary.

### 4. Account activation lifecycle remains a technical blocker

The integration plan correctly warns against creating an enabled account and relying on a later asynchronous disable. Before implementation, verify the exact Appwrite Cloud and pinned SDK behavior for creating/disabling accounts and issuing sessions. Do not assume a disabled account can or cannot authenticate without a tested, documented result.

### 5. Scheduled bulk approval needs immutable intent and safe execution

Preserve the user's decision that a confirmed scheduled batch cannot be cancelled through the admin interface. Store a server-side immutable snapshot of selected member IDs, count, scheduled local Cairo time, and confirming administrator. At execution, re-check each member independently; do not override a changed state. Record per-member success/skip/failure. Protect against duplicate execution and concurrent runs. A batch's no-cancel rule must not force approval of an account that is no longer eligible.

### 6. Rejection reason and privacy

Require a reason for an administrator's rejection decision. Separate internal audit notes from any user-facing explanation. Do not store identity-card images, full identity numbers, or paper signatures in NOX NEXT.

### 7. Audit and authorization

Every administrative transition should record actor, target account, previous state, new state, timestamp, reason/category, and outcome. Enforce administrator authorization on the server for every administrative operation; never trust a role supplied by the browser.

## Required staging tests

- Each of the four canonical states is tested against every protected route and API.
- Missing, unknown, malformed, or stale state always denies access.
- Client edits to local storage, URL, request body, or displayed role cannot grant access.
- Every allowed and disallowed state transition is tested.
- Ordinary members cannot call administrative actions.
- Rejection requires a reason and does not expose internal notes.
- Bulk batch execution is idempotent, uses Cairo timezone, revalidates each member, and records per-member outcomes.
- Tests use synthetic accounts only.

## Release gate

This review is documentation-only. Before backend implementation, the user must separately authorize the proposed backend/schema/Function changes after being told that the connected branch may trigger an Appwrite Function redeployment. Resolve the Node runtime/package engine mismatch and verify the configured browser hostname/CORS before any live authentication test.

**AI review conclusion:** proceed with documentation alignment and test design; do not implement or deploy the authentication gate yet.
