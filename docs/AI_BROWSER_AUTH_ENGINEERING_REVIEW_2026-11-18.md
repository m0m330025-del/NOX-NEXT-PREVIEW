# NOX NEXT — AI Engineering Review: Browser Authentication

**Date:** 2026-11-18  
**Review type:** AI-assisted static repository review (not a human engineering sign-off)  
**Branch:** `feature/auth-login-staging`

## Decision

Keep NOX NEXT as a browser-first web application. The browser may host the public login, registration, and password-recovery screens and may use the Appwrite Web SDK with the public endpoint and project ID. Never place an Appwrite API key or privileged credential in browser code.

**Do not treat a successful Appwrite email/password session as approval to enter NOX.** Authentication proves control of credentials; it does not prove that the owner has reviewed and approved the registration.

## Findings from the current branch

- `login.html` imports `core/auth-client.js` and attempts browser-side email/password session creation.
- `core/auth-client.js` uses Appwrite's `createEmailPasswordSession`, `account.get`, session deletion, and password-recovery methods.
- `recovery.html` implements the browser recovery form.
- `signup.html` is still a local validation preview. It does not create an Appwrite account.
- The login page currently displays a message that approval will be checked, but no authoritative approval-status endpoint is wired into this flow.
- No live Appwrite browser-domain/CORS configuration or end-to-end browser test was verified in this review.

## Engineering recommendations

1. Keep the web-browser architecture; do not require a native mobile app.
2. Keep email + password for v1 and use the Appwrite Web SDK only for the user's own authentication session.
3. Add a trusted server-side session gate that reads the member's authoritative status. Only `approved` and enabled accounts may access member routes or protected data.
4. Treat `pending_review`, `rejected`, `suspended`, missing, and unknown states as denied by default.
5. Never accept an `approved` flag, role, NOX ID, or status supplied by browser storage, URL parameters, or request body as authoritative.
6. Keep registration approval and admin actions on protected server endpoints with explicit authorization and audit records. Keep ID-card images, full identity numbers, and paper signatures outside NOX.
7. Add browser-domain allowlisting, recovery redirect allowlisting, rate limiting, generic login errors, and tests for session expiry/logout.
8. Use synthetic test accounts only. Do not create or activate real member accounts as part of this staging work.

## Execution boundary

This review is documentation only. It does not change application code, database schema, Appwrite settings, secrets, Functions, or deployments.

The repository branch is connected to an Appwrite Function. Any backend, schema, runtime, secret, or Function change can trigger redeployment and requires a separate explicit approval after explaining the impact. No such change is authorized by this review.

## Required acceptance tests before any real rollout

- A pending account can authenticate only into a restricted pending state and cannot read member data.
- Rejected and suspended accounts are denied.
- An approved account reaches only authorized member routes/data.
- Browser refresh rechecks server-side status.
- Client-side tampering cannot elevate status or role.
- Admin approval endpoints reject ordinary users and produce audit events.
- Password recovery, logout, expired sessions, rate limiting, and generic error behavior pass.
