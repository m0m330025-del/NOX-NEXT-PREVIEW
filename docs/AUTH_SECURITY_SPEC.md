# NOX NEXT — Authentication and Eligibility Security Specification

## Status

**Design only — no authentication or eligibility service is deployed.**

The current product notes describe NOX NEXT as an adults-only experience. The browser-only date-of-birth check in `signup.html` is not a security control. Do not use it to grant access, create a trusted account, or issue an application session.

## Non-negotiable trust boundary

- A browser must never decide that an account is eligible for an adults-only area.
- A date typed into a form, a JavaScript age calculation, localStorage value, QR code, or editable profile field is not proof of eligibility.
- Do not enable public self-service signup or unrestricted login for the restricted product until a trusted, server-verified eligibility process has been selected, deployed, and independently tested.
- Do not expose Appwrite API keys, provider secrets, verification tokens, or session secrets in frontend code, GitHub Pages, browser storage, logs, or chat.
- Do not store identity-document images or full document numbers in the NOX profile database.

## Required architecture before any account access is enabled

1. Select a legally appropriate, reputable age-assurance provider. This decision requires the product owner to review applicable law, privacy obligations, provider terms, and data-retention practices.
2. The provider must return a verifiable server-to-server result or signed attestation. A client-submitted `isAdult: true` flag or unverified birth date is never accepted.
3. A trusted backend endpoint validates the attestation's signature, issuer, audience, expiry, nonce, and one-time use. It fails closed on missing, invalid, expired, replayed, or ambiguous results.
4. The backend records only the minimum necessary eligibility result and provider reference, not raw identity documents. Define retention, deletion, appeal, and re-verification policies before launch.
5. Account creation and session issuance remain behind trusted server checks. A direct call to Appwrite's public Auth endpoints must not be treated as an eligibility check.
6. Every protected backend operation independently checks the account's current eligibility state. Frontend route guards are only user experience and never authorization.
7. Revocation, provider outage, account recovery, and suspected fraud have explicit fail-closed handling and human-reviewed appeal paths.

## Appwrite boundaries

- Keep the existing `NOX_CORE` TablesDB tables private with row security enabled.
- Appwrite Auth owns password handling; never add password or password-hash columns to `users`.
- The `users` row is created or linked only by trusted backend code after all required checks pass.
- Derive the acting identity from a server-validated Appwrite session/JWT. Never trust a client-supplied `authUserId`, `senderId`, or `userId`.
- Do not grant broad client write permissions to profile, friendship, request, or notification tables.
- Keep the browser-facing Appwrite project ID and endpoint as public identifiers only; API keys remain server-side.

## Required security tests

- Tampered, missing, expired, replayed, and wrong-audience attestations are rejected.
- A client cannot create an eligible profile by editing JavaScript, localStorage, request bodies, or URL parameters.
- Direct Appwrite Auth API calls cannot grant access to protected data or operations.
- An ineligible, unverified, revoked, or suspended account receives no protected data.
- One account cannot read or modify another account's profile, requests, friendships, or notifications.
- Logs contain no passwords, API keys, session secrets, raw identity documents, or unnecessary personal data.
- Provider outage and backend timeout fail closed without silently granting access.

## Current implementation boundary

The existing login and signup pages are visual previews. They must not redirect a visitor into a protected application area or claim that a real session/account was created. The signup page must not generate a locally stored NOX ID and present it as an account identity. Keep account access disabled until the complete trusted architecture above is implemented and reviewed.

## Release gate

No authentication rollout, user-data access, friend APIs, or restricted-area entry is approved by this document. This is a security design checklist, not a deployed age-verification service, legal opinion, or independent security audit.
