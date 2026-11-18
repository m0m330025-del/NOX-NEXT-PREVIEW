# NOX NEXT — Browser Authentication and Member UI Specification

**Status:** Staging UI specification  
**Date:** 2026-11-18  
**Platform:** Responsive browser experience on mobile and desktop

## Public authentication screens

### Login
- Email and password fields.
- Show/hide password control and accessible labels.
- Submit/loading state and keyboard-friendly validation.
- Generic credential failure message that does not reveal whether an email exists.
- Link to password recovery and registration.
- Never display or request an administrator role, approval flag, or editable account state.

### Registration request
- Collect only the minimum account information required by the approved product flow.
- Create a request in `PENDING_REVIEW`; never let the browser assign another state.
- Clearly explain that submitting a request does not grant member access.
- Do not collect identity-card images, full identity numbers, or paper signatures.
- Do not claim an account is fully activated until the trusted server confirms the lifecycle result.

### Password recovery
- Use the configured Appwrite recovery flow only after allowed browser hostnames and recovery redirect URLs are configured and tested.
- Avoid account-enumerating messages.
- Do not place secrets or privileged API keys in browser code.

## Restricted status screens

### Pending
Message: “Your membership request is under review.”
Actions: sign out; return to login.
No member navigation, room previews, private profile data, or member API data.

### Rejected
Message: “Your membership request was not approved.”
If a user-facing reason is provided, it must be explicitly sanitized and separate from internal administrator notes.
Actions: sign out; use the approved support route if one exists.

### Suspended
Message: “Access to your membership is currently unavailable.”
Do not reveal internal moderation notes or administrator identities.
Actions: sign out; use the approved support route if one exists.

### Approved
Only after a fresh server-side approval check, route to the member home page. Every subsequent protected request must re-check authorization.

## Shared browser requirements

- Responsive layout for common mobile and desktop widths.
- Clear loading, empty, validation, network-error, and expired-session states.
- Safe focus order, visible focus indicators, semantic labels, and adequate contrast.
- No sensitive account state persisted as an authority in localStorage/sessionStorage.
- On refresh, session and membership status are revalidated by the server.
- Logout deletes the current Appwrite session and clears local UI state.
- Rate-limit login, registration, and recovery on trusted infrastructure.
- Restrict Appwrite browser platform hostnames and recovery redirects to approved origins.

## Integration status

This is a design specification, not a claim that these screens or server gates have been implemented. Existing login/recovery files were reviewed previously; registration remains a preview and no authoritative approval endpoint was found in the reviewed branch.
