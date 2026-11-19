# NOX NEXT Login and Registration Authentication Integration Plan

**Status:** Engineering plan; documentation only.  
**Target staging branch:** `feature/auth-login-staging`  
**Policy source:** `docs/NOX_ALL_AGES_REGISTRATION_DECISION_2026-11-18.md`

## Product and registration policy
- NOX is a general social platform for users of all ages; no minimum-age threshold applies to account creation.
- Date of birth is optional. It must not be required, used to reject registration, or used to disable an account.
- Do not request identity documents solely to prove age.
- Keep privacy, reporting, blocking, anti-abuse, content moderation, age-aware safety defaults, and feature-specific safeguards. These do not silently become a general age gate.
- The former 18+ proposal in `docs/AI_REGISTRATION_AGE_VERIFICATION_REVIEW.md` is superseded and must not be implemented.

## Authentication model
The intended first login method is email + password through the Appwrite Web Client SDK, using the existing public endpoint and project ID. The browser must never contain an Appwrite API key or privileged Users API credential.

The implementation must:
1. Create an email/password session using the pinned Appwrite Web SDK API.
2. Retrieve the current authenticated user.
3. Ask a trusted server endpoint for authoritative membership status.
4. Route to member home only when the server confirms `APPROVED`.
5. Provide logout by deleting the current session.
6. Use Appwrite password recovery only after allowed browser hostnames and recovery redirect URLs are configured and tested.
7. Use generic credential/recovery messages that do not disclose whether an email exists.

## Canonical membership lifecycle
Use exactly these values in all storage, APIs, tests, and UI:
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Every submitted membership request starts as `PENDING_REVIEW`, assigned by trusted server code. A browser cannot choose or modify the state.

Allowed transitions:
- No membership → `PENDING_REVIEW` by the registration workflow.
- `PENDING_REVIEW` → `APPROVED` or `REJECTED` by an authorized administrator.
- `APPROVED` → `SUSPENDED` by an authorized administrator.
- `SUSPENDED` → `APPROVED` only through explicit authorized reinstatement.
- All other transitions are denied. A rejected request remains denied unless a separate audited reconsideration workflow is designed.

A successful credential check is not membership approval. Pending, rejected, suspended, missing, malformed, or unknown states must not receive member-area or member-data access. The server must derive the account identity from a verified Appwrite session/JWT, load the authoritative record, and enforce approval on every protected operation. A browser route guard is navigation UX only.

## Account lifecycle blocker
Before implementation, verify the exact Appwrite Cloud behavior and pinned SDK methods for creating accounts, disabling accounts, and issuing sessions. Do not assume an unapproved account can safely receive a session and later be disabled. Choose a server-controlled lifecycle that prevents unapproved access; fail closed if the safe lifecycle cannot be established.

## Administrative and scheduled approval
- Individual approval/rejection/suspension/reinstatement is restricted to explicitly authorized administrators and audited.
- Rejection requires a reason; internal notes must remain separate from sanitized user-facing text.
- Bulk approval may include only the exact selected, reviewed pending requests.
- A confirmed scheduled batch retains the previously approved no-cancel product rule, but every member is revalidated at execution. Changed/ineligible records are skipped and audited; the batch must never force an invalid transition.
- Store immutable batch intent and per-member outcomes server-side. Use a trusted scheduler, idempotency, and concurrency protection; do not depend on an open browser tab.

## Required tests before enabling member access
- New registrations are pending and cannot enter member pages or read protected data.
- Approved accounts can access only resources they are authorized to use.
- Pending, rejected, suspended, missing, malformed, and unknown states are denied.
- Tampering with local storage, URLs, request bodies, or displayed roles cannot grant access.
- Credential errors are non-enumerating; logout and recovery behave correctly.
- Refreshing protected pages rechecks session and membership.
- Ordinary members cannot invoke administrative transitions.
- Scheduled batches are idempotent, use `Africa/Cairo` for local scheduling, revalidate every member, and audit outcomes.
- Tests use synthetic identities only.

## Blocking prerequisites
1. Verify the Appwrite project browser platform hostnames and recovery redirect allowlist.
2. Verify the actual database schema and permissions before proposing a migration.
3. Verify pinned `node-appwrite@31.3.0` method signatures and account lifecycle behavior.
4. Resolve the moderation Function Node engine declaration against the actual deployed Node runtime before any Function deployment.
5. Add server-side rate limiting and abuse protection.
6. Prepare isolated staging changes and synthetic-account tests.

## Scope and deployment warning
This file records a plan only. It does not claim that signup, the membership API, schema, or Function is deployed. Any backend, schema, runtime, secret, Appwrite setting, or Function deployment change requires separate explicit approval after a clear redeployment warning. Do not change `main`, the original Railway service, or the other Railway project as part of this staging work.
