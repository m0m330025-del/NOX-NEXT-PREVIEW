# NOX NEXT Login and Registration Authentication Integration Plan

**Status:** AI-assisted engineering recommendation; documentation only.  
**Branch:** feature/moderation-functions-scaffold

## Repository findings (reviewed 2026-11-18)
- `login.html` is a visual preview. Its submit handler explicitly does not authenticate or create a session.
- `signup.html` is also a preview. It performs a browser-side age calculation and password-match check, then explicitly states that no account is created.
- `core/appwrite-config.js` contains the Appwrite endpoint and public project/database identifiers; it correctly contains no API key.
- The existing `NOX_CORE` bootstrap workflow is present, but this review does not establish that it has successfully run against Appwrite.
- `functions/moderation/src/index.js` validates an Appwrite user JWT for its existing scaffold routes. Its moderation operations remain unimplemented; it is not currently a registration or login service.
- The moderation package README says it is a staging scaffold and has not been deployed or integration-tested against the live database.

## Recommended v1 login method
Use **email + password through the Appwrite Web Client SDK**. This matches the existing login screen and avoids introducing phone/SMS, social-provider, or passwordless dependencies in the first release.

Client responsibilities:
1. Create an Appwrite `Client` using the existing public endpoint and project ID.
2. Create an `Account` service.
3. Submit the email and password through Appwrite's `createEmailPasswordSession` method.
4. Call `account.get()` to confirm the current session.
5. Load the member profile through an authenticated server endpoint; do not read private TablesDB rows directly from the browser.
6. Route only fully approved, enabled accounts to the member home page.
7. Provide sign-out with `deleteSession({ sessionId: "current" })`.
8. Implement password recovery through Appwrite's recovery flow after the project email sender and allowed redirect URLs are configured and tested.

The browser must never contain an Appwrite API key, server secret, or privileged Users API credential. Use generic login failure messaging that does not disclose whether an email is registered.

## Registration approval gate (must be enforced server-side)
The user's approved product rule is that every new registration remains pending until the user has completed the owner's in-person review and the owner has approved it. The card and paper signature are reviewed outside NOX NEXT and are not uploaded or stored by the app.

Recommended state model:
- `pending_review`
- `approved`
- `rejected`

A pending or rejected account must not gain member-area access. The browser's date-of-birth check is only a convenience and is not a security control. Eligibility and approval must be validated by trusted server logic. Never trust a client-supplied `approved` flag, role, NOX ID, or account status.

The safest implementation must prevent a new user from obtaining an enabled Appwrite session before approval. Use a server-controlled account lifecycle and the Appwrite Users API from a protected backend. Verify the exact disabled-user creation/status behavior against the pinned SDK and Appwrite Cloud version before implementing; do not create an enabled account in the browser and rely on a later asynchronous disable as an approval gate.

After approval, the trusted backend enables the account and records reviewer, decision timestamp, and audit metadata. Rejection requires a written reason, as already approved. Do not store ID-card images, full identity numbers, or paper signatures in NOX NEXT.

## Administrative and scheduled approval
- Individual approval/rejection is restricted to explicitly authorized administrators.
- Bulk approval includes only the exact selected, already-reviewed requests.
- A scheduled batch displays the exact member snapshot, count, date, time, and Cairo timezone before final confirmation.
- Per the user's approved decision, a saved scheduled batch cannot be cancelled in the admin interface. Revalidate each member's pending status and eligibility at execution time; skip and audit any request that is no longer eligible rather than overriding a later state.
- Use server-side scheduling and an immutable per-member audit result. Do not rely on a browser tab or client clock to execute scheduled approvals.

## Required tests before enabling login
- New registration cannot enter the member area before approval.
- Approved account can sign in and access only its authorized data.
- Rejected, suspended, and pending accounts cannot enter the member area.
- Wrong password and unknown email produce non-enumerating errors.
- Expired session, logout, and password recovery behave correctly.
- Refreshing a protected page rechecks the session and approval state.
- Admin-only approval endpoints reject ordinary members.
- Bulk approval snapshot, timezone, execution-time revalidation, duplicate execution, and audit records are tested.
- Use synthetic accounts only; no real ID documents or real member credentials in tests.

## Blocking prerequisites / risks
1. Confirm the existing Appwrite project has the Web platform configured for the exact deployed hostname(s), and verify CORS.
2. Confirm the `NOX_CORE` database bootstrap completed; the current repository review cannot verify live Appwrite state.
3. Confirm the exact Node SDK method signatures and disabled-account behavior for pinned `node-appwrite@31.3.0`.
4. Design and review the registration/admin approval backend and its least-privilege API key scopes.
5. Resolve the existing Node engine mismatch before deploying any backend package: the moderation package declares Node `>=22 <23`, while the previously recorded deployed Function runtime was Node 26.
6. Add server-side rate limiting and abuse protection for registration, login, and recovery.

## Scope and deployment warning
This document records an engineering plan only. No login/signup code, schema, Function, Appwrite setting, API key, workflow, or deployment was changed. The connected branch may redeploy an Appwrite Function when backend files change. Any backend/schema/runtime/secret change or Function deployment requires the user's explicit approval after a clear redeployment warning.
