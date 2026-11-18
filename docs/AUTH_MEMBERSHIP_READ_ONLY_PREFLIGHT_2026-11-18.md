# NOX NEXT — Auth & Membership Read-only Preflight
Date: 2026-11-18
Branch: `feature/auth-login-staging`
Repository: `m0m330025-del/NOX-NEXT-PREVIEW`
Status: read-only source inspection; no code, schema, environment, runtime, or deployment changes.

## Executive result

**Preflight status: BLOCKED for implementation/release until the P0 authorization and runtime facts are resolved.**

The branch files fetched during this inspection confirm that the browser login currently creates an Appwrite session and retrieves the account, but does not call a membership-status endpoint. The Function authenticates the caller JWT, then routes requests; no universal membership-state check appears between identity resolution and member route handling. The moderation route remains a 501 placeholder after moderator authorization.

This is a source review only. It does not establish the currently deployed Function version, live database schema, actual runtime setting, or production behavior.

## Files inspected and observed revisions

| File | Blob SHA | Read-only finding |
|---|---|---|
| `login.html` | `e148b2a7a1fb6d81e9bc997898024216be9a066c` | Login calls `createLoginSession`; success message says management approval will be checked before member pages, but this page itself does not perform a status lookup or redirect. |
| `signup.html` | `69ee337b2d4921d6ebcd705d4ae628b22f67de9c` | UI explicitly says it is a preview and does not create an account or send data. |
| `recovery.html` | `acaa5247ade6c3029121a5ae9df9bfe8b2f2e4d5` | Recovery page exists; must remain independent from membership state transitions. |
| `core/auth-client.js` | `50b1a1c293ea85f889dba1ae003078c20bdb1a8f` | Uses Appwrite Web SDK session creation, account.get, current-session cleanup on account lookup failure, and recovery methods. No membership status method is present in the inspected file. |
| `core/appwrite-config.js` | `bc4a3ab5b9a108a0df0f223fb6467b5710e5aed9` | Contains public endpoint/project/database identifiers and explicitly warns not to put an API key in browser code. |
| `functions/moderation/src/index.js` | `56d446ec0c8f65ab965f523fcd9e793c8b774e1c` | Verifies the Appwrite user JWT and resolves the caller account. The inspected flow proceeds to route handling without a shared membership-state gate. Moderation path checks moderator identity and then returns 501. |
| `functions/moderation/src/store.js` | `ab8e7b2ea53127e1424ec3758f0d79010994fbd7` | Existing persistence covers social/conversation/notification/report/block operations; inspected matches do not establish a canonical account-membership store. Existing conversation membership rows are resource membership, not account approval. |
| `functions/moderation/package.json` | `dd9f5803553b8fc0f92c0ac56d6b8f0a97159265` | Declares Node engine `>=22 <23` and `node-appwrite` 31.3.0. |
| root `package.json` | `473872ff4c9059cf37d22bfeba2c589dc3b429da` | Declares Node engine `>=22 <27` and `node-appwrite` 31.3.0. |
| `scripts/setup-appwrite.mjs` | `3ece38bc4f6c8362d276da26ee0a6c5f1d660276` | Existing setup logic skips columns by key if already present; it does not verify that an existing same-key column has the expected type/size/required configuration. |

## Confirmed source-level blockers

### P0 — Membership authorization is not yet enforced in the inspected Function flow
The Function verifies authentication, but authentication is not membership approval. Add a shared server-side membership gate before every member-only route and enforce object-level authorization. Pending, rejected, suspended, missing, malformed, and lookup-failure states must fail closed.

### P0 — Login does not yet perform authoritative membership routing
The browser login success handler only displays a message. It must call a server-owned status endpoint after successful authentication and route to pending/rejected/suspended/approved UI states. The server must still enforce every API request; UI routing is not a security control.

### P0 — Registration is still preview-only
The signup page explicitly states no account is created. Registration-to-`PENDING_REVIEW` is not implemented in the inspected page.

### P1 — Admin moderation implementation is incomplete
The moderator route returns `501 not_implemented`. Admin membership queue and approve/reject/suspend/reinstate actions need separately protected server implementation and audit records.

### P1 — Runtime declaration mismatch
The Function package range `>=22 <23` conflicts with the root package range `>=22 <27`. The previously reported deployed Node 26 setting is not independently verified in this read-only GitHub inspection. Confirm actual Appwrite Function runtime and align package engines before deployment.

### P1 — Schema bootstrap is not a schema verifier
The setup script's same-key skip behavior can conceal a type/size/required mismatch. Add a read-only verifier and an additive migration tested in an isolated environment before any live schema changes.

### P1 — No live verification evidence
This inspection did not call the deployed Function, inspect Appwrite Console, run tests, or verify collection permissions/attributes. Do not label the feature production-ready.

## Required read-only checks before proposing a backend diff

1. Obtain authorized read-only confirmation of the deployed Function runtime, deployment ID/version, entrypoint, and current environment variable *names* (never print secret values).
2. Inspect actual Appwrite TablesDB collections, columns, indexes, and permissions without modifying them.
3. Confirm Appwrite Web SDK 29.0.0 and server SDK 31.3.0 API compatibility for the methods used.
4. Enumerate every route in `functions/moderation/src/index.js` and classify public-authenticated, member-only, admin-only, and public-read behavior.
5. Confirm current test coverage and identify isolated staging resources for synthetic accounts.
6. Prepare an exact, minimal patch proposal and deployment/rollback plan.

## Approval boundary

No source implementation, database migration, Function setting, runtime change, secret change, or deployment is authorized by this document. The branch is associated with an Appwrite Function, so backend commits may trigger redeployment. Before such a change, present the exact file diff, expected behavior, test plan, and redeployment risk for separate explicit approval.

## Final disposition

Read-only preflight completed for the listed GitHub files. **Implementation and release remain blocked** by the P0 membership gate, authoritative login status flow, and unimplemented signup workflow. The next safe step is to draft a minimal change proposal based on these findings; no live Appwrite configuration can be claimed verified from GitHub source alone.
