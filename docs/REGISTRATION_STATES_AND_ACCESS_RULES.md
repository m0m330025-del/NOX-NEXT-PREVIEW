# NOX NEXT — Registration States and Access Rules

**Status:** AI-selected product/security decision  
**Date:** 2026-11-18  
**Scope:** Requirements only; no backend or database changes.

## Member lifecycle

| State | Meaning | Member-area access |
|---|---|---|
| `PENDING_REVIEW` | Registration received; owner review is pending | Deny |
| `APPROVED` | Owner approved the request and account is enabled | Allow, subject to normal authorization |
| `REJECTED` | Owner rejected the request | Deny |
| `SUSPENDED` | Account access has been suspended | Deny |

Unknown, missing, malformed, or conflicting states must fail closed (deny access).

## Browser experience

- Login, registration, recovery, and status pages are responsive web pages.
- A successful credential check is not proof of membership approval.
- Pending users see a neutral “request under review” page and a sign-out action.
- Rejected users see a neutral rejection notice. Any rejection reason shown must be an approved, user-safe message, not internal moderation notes.
- Suspended users see an access-unavailable notice and a safe support route that does not expose private administrator details.
- Approved users are routed to the member home page only after the server confirms approval.

## Trusted enforcement

- The server derives the authenticated user from the verified Appwrite session/JWT.
- The server reads approval state from its authoritative record.
- Never trust browser storage, query parameters, form fields, or client-side route guards for approval.
- Every protected API and data operation independently enforces authentication, approval, and authorization.
- Administrative state changes require an authenticated, explicitly authorized administrator and an audit record.
- Do not store identity-card images, full identity numbers, or paper signatures in the application.

## Staging acceptance checklist

- [ ] Pending state denies member routes and protected data.
- [ ] Rejected state denies member routes and protected data.
- [ ] Suspended state denies member routes and protected data.
- [ ] Approved state allows only authorized resources.
- [ ] Refreshing a protected page rechecks the server state.
- [ ] Client-side tampering cannot change the authoritative state.
- [ ] Logout clears the current session.
- [ ] Tests use synthetic identities and never real member credentials.

## Change boundary

This is a requirements artifact only. It does not create accounts, change Appwrite settings, modify schema or Function code, expose secrets, or deploy anything. Backend implementation remains gated by a separate explicit approval after a clear redeployment warning.
