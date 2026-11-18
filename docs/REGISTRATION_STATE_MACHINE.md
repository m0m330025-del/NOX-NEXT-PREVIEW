# NOX NEXT — Canonical Registration State Machine

**Status:** Approved product/security specification for staging  
**Date:** 2026-11-18  
**Scope:** Requirements only; no runtime changes.

## Canonical values

These exact uppercase values are the only accepted application states:

- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Do not accept lowercase aliases, alternate spellings, client-provided status, or unknown values. Missing, malformed, stale, or unknown status fails closed.

## Initial state

Every submitted membership application begins in `PENDING_REVIEW`. Credential authentication, email verification, or possession of a NOX ID does not imply approval.

## Allowed transitions

| From | To | Who may initiate | Required controls |
|---|---|---|---|
| No membership | `PENDING_REVIEW` | Registration workflow | Server-created record; duplicate protection |
| `PENDING_REVIEW` | `APPROVED` | Authorized administrator | Server authorization; audit event |
| `PENDING_REVIEW` | `REJECTED` | Authorized administrator | Mandatory reason; audit event |
| `APPROVED` | `SUSPENDED` | Authorized administrator | Reason/category; audit event |
| `SUSPENDED` | `APPROVED` | Authorized administrator | Explicit reinstatement; audit event |

All transitions not listed above are denied. A rejected request remains denied. Reconsideration must use a separately audited administrative workflow and must not be implemented as a member-side status edit.

## Access matrix

| State | Authenticate credentials | Member pages | Member APIs/data | Admin actions |
|---|---|---|---|---|
| `PENDING_REVIEW` | May authenticate only if the chosen Appwrite lifecycle safely permits it | Deny | Deny | Deny |
| `APPROVED` | Allow | Allow after server check | Allow after per-operation authorization | Deny unless separately admin-authorized |
| `REJECTED` | May authenticate only to a restricted status experience if safely supported | Deny | Deny | Deny |
| `SUSPENDED` | May authenticate only to a restricted status experience if safely supported | Deny | Deny | Deny |
| Unknown/missing | No trusted access | Deny | Deny | Deny |

The preferred implementation prevents an unapproved account from receiving an enabled member session. The exact Appwrite disabled-account/session behavior must be verified against the deployed Appwrite Cloud version and pinned SDK before implementation. Do not assume the restricted-session option is safe without testing.

## Server enforcement

1. Verify the Appwrite session/JWT server-side.
2. Derive the account identity from the verified credential, never from a request field.
3. Read the canonical state from the authoritative server-side membership record.
4. Deny if state is absent, malformed, unknown, stale, or not `APPROVED`.
5. Apply resource-level authorization after the approval check.
6. Repeat enforcement on every protected API/data operation; a page redirect is not security.
7. Never trust browser storage, URL parameters, request body fields, displayed role, or NOX ID as proof of approval.

## Audit requirements

Record actor, target account, previous state, new state, timestamp, decision category/reason, request or batch identifier, and outcome. Restrict audit access to authorized administrators. Keep internal notes separate from user-facing rejection messages.

## Privacy requirements

Identity-card inspection and paper signatures remain outside NOX NEXT. Do not upload or retain ID-card images, full identity numbers, or paper signatures in the application.

## Concurrency and idempotency

State changes must be conditional on the expected previous state. Concurrent decisions must not overwrite one another silently. Duplicate requests must not create duplicate transitions or duplicate audit outcomes. Every rejected or skipped operation must return a safe result and be auditable.
