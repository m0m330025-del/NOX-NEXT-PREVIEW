# NOX NEXT — Authentication and Membership Security Specification

## Status
**Design specification only — the complete registration and membership authorization service is not deployed.** Existing browser pages and helpers must not be described as a complete account lifecycle.

## Current product policy
- NOX is a general social platform for users of all ages.
- There is no minimum-age threshold for account creation.
- Date of birth is optional and must not be used to reject registration or disable an account.
- Registration must not request identity documents solely to prove age.
- Privacy, reporting, blocking, anti-abuse, age-aware safety defaults, and feature-specific safeguards remain in force. They do not create a general age gate.

The approved product decision is `docs/NOX_ALL_AGES_REGISTRATION_DECISION_2026-11-18.md`. The former 18+ proposal in `docs/AI_REGISTRATION_AGE_VERIFICATION_REVIEW.md` is superseded and must not be implemented.

## Canonical membership states
Use exactly these values throughout the database, API, tests, and UI:
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Missing, malformed, unknown, or conflicting state fails closed. Do not accept lowercase aliases or client-provided state.

## Trust boundary
- Appwrite credential authentication proves control of an account; it does not prove membership approval.
- New registration requests begin as `PENDING_REVIEW`, assigned by trusted server code.
- Only an explicitly authorized administrator may approve, reject, suspend, or reinstate a membership through a server-authorized, audited transition.
- A member receives access to member pages and data only after a fresh server-side check confirms `APPROVED`.
- Every protected API/data operation independently verifies the Appwrite session, loads the authoritative membership record, checks `APPROVED`, and then applies resource-level authorization.
- Missing or unavailable membership status denies access.
- Never trust localStorage, sessionStorage, query parameters, form fields, a displayed role, NOX ID, or client-side route guards as authorization.
- Never expose Appwrite API keys, provider secrets, verification tokens, or privileged credentials in frontend code.

## Registration and privacy
- Collect only the minimum approved account information.
- Date of birth, if offered, must remain optional and must not affect general registration eligibility.
- Do not collect identity-card images, full identity numbers, or paper signatures in NOX NEXT.
- Keep internal review notes separate from any sanitized user-facing rejection message.
- Rejection requires a reason and an audit event.

## Appwrite boundaries
- Appwrite Auth owns password handling; never add password or password-hash columns to user profile or membership tables.
- Derive identity from a server-verified Appwrite session/JWT, never from request-supplied user IDs.
- Keep privileged API keys server-side and scoped to the minimum required operations.
- Verify the exact deployed Appwrite Cloud behavior and pinned SDK signatures for account creation, disabled accounts, and session issuance before choosing the lifecycle implementation.
- Do not assume that creating an enabled account and disabling it asynchronously is a safe approval gate.

## Release gate
This document is a design specification, not a deployed membership service, legal opinion, or independent security audit. Do not enable member access until server-side membership enforcement and synthetic-account tests pass. Backend, schema, Function, secret, or deployment changes require separate explicit approval after explaining the redeployment impact.
