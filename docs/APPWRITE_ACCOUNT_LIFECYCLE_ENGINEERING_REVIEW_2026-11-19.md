# NOX NEXT — Appwrite Account Lifecycle Engineering Review

**Date:** 2026-11-19  
**Branch:** `feature/auth-login-staging`  
**Status:** Historical engineering review; superseded on 2026-11-19 by the approved immediate self-service registration policy. No code, schema, Appwrite setting, secret, or deployment changes.

## Scope and evidence

Reviewed the staging branch's:
- `core/auth-client.js`, `core/auth-guard.js`, `login.html`, and `signup.html`.
- `functions/moderation/src/index.js`, `src/store.js`, and `src/policy.js`.
- `scripts/setup-appwrite.mjs` and the moderation/browser-auth test files.
- Pinned `node-appwrite@31.3.0` SDK source, specifically `Users.create`, `Users.updateStatus`, `Users.createToken`, and `Account.createRecovery`.

External Appwrite references:
- https://appwrite.io/docs/references/cloud/server-nodejs/users
- https://appwrite.io/docs/references/cloud/server-nodejs/account
- https://appwrite.io/docs/apis/response-codes
- https://appwrite.io/docs/advanced/security/authentication

This is a source/documentation review, not a live test against the NOX Appwrite project. The exact deployed Cloud behavior, project auth methods, existing records, and runtime configuration remain to be verified in a controlled staging test.

## Verified findings

1. The current browser login creates an Appwrite email/password session, retrieves the account, then navigates directly to `home.html`.
2. The current browser auth guard checks only whether `account.get()` returns a user. It does not ask a trusted service for membership approval.
3. The current `signup.html` is informational only and does not create an account.
4. The current moderation Function verifies the caller's Appwrite JWT, but does not load an authoritative membership record before dispatching friend, notification, conversation, message, report, or block routes.
5. The existing TablesDB bootstrap creates a private `users` table with `authUserId`, `noxId`, `displayName`, optional `accountStatus`, and optional `role`. It does not define a dedicated membership table or registration-request table.
6. In the pinned `node-appwrite@31.3.0` source:
   - `Users.create` accepts user ID, email, phone, password, and name; it does not accept an initial `status` argument.
   - `Users.updateStatus({ userId, status })` is a separate operation.
   - `Users.createToken({ userId, ... })` creates a login token; it is not a password-setup invitation.
   - `Account.createRecovery({ email, url })` starts Appwrite's password recovery flow.
7. Appwrite documents `user_blocked` as an authentication error for a blocked account. This supports using disabled accounts as a deny mechanism, but it does not make create-then-disable safe: the two API calls are separate and leave a race window.
8. The current moderation Function package declares Node `>=22 <23`, while the previously inspected deployed runtime was Node 26. This mismatch remains unresolved and must be checked before a Function deployment.

## Security conclusion

Do **not** implement registration as:
1. Create an enabled Appwrite account from the browser.
2. Create a pending membership record afterward.
3. Disable the account asynchronously.

That sequence has a race window and can issue a usable session before the account is blocked. A browser redirect or client-side membership flag cannot close that gap.

Do **not** store a submitted password in a registration-request table, audit row, Function log, or ordinary profile record.

## Superseding product decision — 2026-11-19
The user approved immediate self-service registration: no administrative approval before entry, automatic `APPROVED` membership after successful trusted account creation, immediate login after that is confirmed, and no one-account-per-IP restriction. The following earlier manual-approval lifecycle is historical and must not be implemented as the current product flow.

## Current engineering direction
Use a trusted, idempotent registration workflow that creates the Appwrite Auth account and authoritative `APPROVED` membership before issuing or enabling a usable session. The browser must never write membership state or gain access merely because Appwrite credentials succeeded. Do not use IP as a unique-person key or lifetime signup quota. Apply proportionate rate limiting only after verifying trustworthy client-IP/proxy metadata and privacy requirements.

## Historical account lifecycle (superseded)

The following registration-request-first flow reflected the previous manual-approval policy and is retained only as historical analysis. Do not use it as the current product flow.

### A. Submit registration request

- Public registration endpoint validates and normalizes the minimum required fields.
- Persist a private request with state `PENDING_REVIEW`.
- Store no password and no password hash.
- Date of birth remains optional and must not be used as a general eligibility gate.
- Enforce a unique normalized email constraint and server-side rate limiting.
- Return a neutral acknowledgement; do not disclose whether an email is already associated with an account.
- Do not issue an Appwrite session.

### B. Administrator decision

- Only a separately authorized membership administrator may approve or reject a pending request.
- Do not automatically equate the existing moderation allowlist with membership-administrator authority.
- Use conditional state transitions, idempotency, and append-only audit records.
- Keep internal notes separate from user-facing messages.

### C. Activate only after approval

Recommended controlled sequence:
1. Re-read and lock/claim the pending request using a concurrency-safe operation.
2. Create the Appwrite Auth user server-side only after the administrator's approval, using a cryptographically random, high-entropy temporary password that is never returned, logged, or stored by NOX.
3. Create the authoritative membership record for that Appwrite user ID with state `APPROVED`.
4. Mark the registration request approved and write the audit outcome.
5. Only after those records are confirmed, call Appwrite password recovery for the approved email, using a fixed, allow-listed NOX recovery URL. The user chooses their own password through Appwrite's recovery flow.
6. If any step fails, keep member access denied. Make retries idempotent and reconcile a created Auth user with a missing membership record before sending any recovery email.

The random temporary password means NOX does not need to retain the user's chosen password before approval. Account creation occurs only after approval. An account created during a partial failure still receives no NOX member-data access unless the authoritative membership record is present and `APPROVED`.

This sequence must be tested in an isolated Appwrite staging project before adoption. In particular, verify the deployed Cloud behavior and allow-listed recovery URL, and verify that password recovery completion does not itself create an authenticated session. If the exact project configuration cannot support this flow safely, stop and redesign rather than falling back to create-then-disable.

## Authoritative membership and enforcement

- Add a dedicated private membership record keyed uniquely by immutable Appwrite `authUserId`; do not overload the existing optional `users.accountStatus` field without a migration and compatibility review.
- Use exactly `PENDING_REVIEW`, `APPROVED`, `REJECTED`, and `SUSPENDED` for the canonical membership state.
- A missing row, duplicate/conflicting row, malformed state, unknown state, or membership-store error denies access.
- After JWT verification, the Function must load membership state before any member-only route accesses the store.
- Apply the gate to all member-only routes, including profile lookup, notifications, friend requests, friendships, conversations, messages, reports submitted by a member, and blocks.
- Admin routes require a separate server-side membership-admin check.
- The status endpoint may reveal only the caller's own safe status; it must not return internal notes, audit records, or other users' data.
- Page guards are navigation UX only. Protected APIs and direct data permissions must independently enforce access.

## Required tests before any live enablement

Use synthetic identities in isolated staging resources:
- Pending registration creates no Appwrite Auth user and no session.
- Duplicate normalized email requests are handled without leaking account existence.
- No submitted password appears in database rows, logs, or audit data.
- Non-admin cannot approve/reject or access admin endpoints.
- Approval creates one Auth user and one approved membership record, even on retries.
- Failure after Auth-user creation but before membership persistence denies all member routes and is safely recoverable.
- Password-recovery invitation is sent only after approval is persisted.
- Pending, rejected, suspended, missing, malformed, duplicate, and unknown membership states are denied.
- Approved user can access only permitted resources.
- Every member route is covered by a table-driven gate test.
- Client-supplied `approved`, `role`, `membershipState`, or user IDs cannot grant access.
- Recovery completion changes credentials only and does not bypass the membership gate.
- Rate limits, idempotency, concurrent admin decisions, and audit outcomes are tested.

## Explicit non-actions and release boundary

No source code, database schema, Appwrite configuration, API key, Function environment, Node runtime, or deployment was changed in this review.

Before implementing this design, present the exact source diff and the additive schema proposal for approval. Any Function code, Function configuration, secret, runtime, or schema change may require redeployment or a migration and must receive separate explicit approval. Do not change `main`, the original Railway service, or the other Railway preview service.
