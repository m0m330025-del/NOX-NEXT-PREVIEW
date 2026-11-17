# NOX NEXT — Friends Backend Specification (Appwrite)

## Architecture decision

The selected backend for NOX NEXT is **Appwrite**. This document replaces the earlier PostgreSQL-only proposal. Do not run the old SQL migration as part of the Appwrite setup.

- Frontend hosting: Cloudflare Pages (the current preview may still be hosted on GitHub Pages).
- Authentication: Appwrite Auth.
- Database: Appwrite TablesDB database `NOX_CORE`, database ID `6afc583f00382386b997`.
- Media storage: Cloudflare R2, integrated through trusted server-side code when implemented.
- Realtime: Appwrite Realtime with authenticated access, after collection permissions are configured and tested.
- Server-side operations: Appwrite Functions. The browser must not receive an Appwrite API key.

The Appwrite endpoint and project ID in `core/appwrite-config.js` are public client identifiers, not proof that the project exists or that the backend is deployed. Confirm the project ID in the Appwrite Console before running the bootstrap workflow.

## Current verified status

- The repository contains an Appwrite bootstrap script and a manually triggered GitHub Actions workflow.
- The bootstrap script targets the existing database and defines four private TablesDB tables: `users`, `friend_requests`, `friendships`, and `notifications`.
- The TablesDB bootstrap verifies the existing database, creates four private tables with columns and indexes, and verifies the resulting tables.
- The workflow has **not** been confirmed as successfully executed.
- No live database, authenticated friend API, realtime flow, or cross-device friend feature should be described as operational until it has been deployed and tested.
- The existing browser-only friend interface uses local storage and is a demonstration only.

## Appwrite data model

Appwrite Auth owns credentials and authentication sessions. Do not store passwords or password hashes in the `users` collection.

### `users`

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| `authUserId` | string | yes | Appwrite Auth user ID; unique |
| `noxId` | string | yes | Public NOX ID; unique |
| `displayName` | string | yes | Public display name |
| `avatarFileId` | string | no | Storage file reference |
| `createdAt` | datetime | yes | Server-generated creation time |

### `friend_requests`

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| `senderId` | string | yes | Auth user ID of sender |
| `recipientId` | string | yes | Auth user ID of recipient |
| `status` | string | yes | Server-validated state: pending, accepted, declined, cancelled |
| `createdAt` | datetime | yes | Server-generated creation time |
| `updatedAt` | datetime | yes | Server-generated update time |

### `friendships`

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| `userAId` | string | yes | First user ID in canonical sorted order |
| `userBId` | string | yes | Second user ID in canonical sorted order |
| `createdAt` | datetime | yes | Server-generated creation time |

The function must sort the two user IDs consistently before writing a friendship. The unique index then prevents duplicate rows for the same canonical pair.

### `notifications`

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| `recipientId` | string | yes | Auth user ID of recipient |
| `type` | string | yes | Server-validated notification type |
| `referenceId` | string | no | Related request or entity ID |
| `isRead` | boolean | yes | Read state |
| `createdAt` | datetime | yes | Server-generated creation time |

Additional collections, including temporary QR tokens, blocks, and reports, must be designed and reviewed before those features are enabled. Do not put permanent database IDs, email addresses, birth dates, or other private account data into QR codes.

## Permissions and trust boundaries

- Keep the collections private by default. The bootstrap script currently creates collections with empty table permissions and row-level security enabled.
- Do not grant broad client write permissions to friend requests, friendships, or notifications.
- Implement friend operations in authenticated Appwrite Functions. Each function must derive the acting user from a server-validated Appwrite identity/session, never from a client-supplied `senderId` or `userId`.
- Grant only the minimum required read/write permissions after the function design is implemented. Test access using two separate accounts, including attempts to read or modify another user's records.
- Never put `APPWRITE_API_KEY` in frontend files, source control, browser storage, or chat messages. Keep it in a protected server environment or GitHub Actions Secret.
- Validate every input on the server, normalize NOX IDs before lookup, rate-limit lookup and request creation, and avoid responses that reveal whether a private account exists.
- Record security events without logging passwords, API keys, session tokens, or private profile data.

## Friend operation contract

Implement these operations as authenticated server-side functions:

1. Look up a user by normalized NOX ID and return only a minimal public profile.
2. Create a friend request using the caller's authenticated identity and the recipient's NOX ID.
3. List incoming and outgoing requests for the caller only.
4. Accept or decline a request only when the caller is its recipient.
5. Cancel a pending request only when the caller is its sender.
6. List confirmed friendships for the caller only.
7. Mark a notification as read only when it belongs to the caller.

The server must prevent self-requests, duplicate pending requests, requests between existing friends, and invalid state transitions. Because Appwrite does not provide PostgreSQL-style partial unique indexes, duplicate-pending prevention must be enforced in trusted server logic and verified under concurrent requests. Do not rely on a frontend check.

When accepting a request, make the state transition and friendship creation safely idempotent. If the selected Appwrite deployment supports database transactions, use them; otherwise implement and test a recoverable server-side sequence that cannot leave duplicate friendships or falsely accepted requests.

## QR identity

A QR code must not contain a permanent database ID, email, date of birth, or other private data. Before QR friend adding is enabled, implement random, high-entropy, short-lived, revocable tokens. Store only a secure hash of each token. A scan must resolve to a minimal profile and require explicit confirmation before a friend request is created.

## Privacy and age eligibility

Collect only profile data needed by the product. Keep date of birth private and perform any age eligibility decision on the server. Any area restricted to adults must remain inaccessible unless eligibility is verified server-side; a frontend-only age prompt is not an access control. Do not expose birth dates or age in friend lookup responses.

## Test and release checklist

- [ ] Confirm the Appwrite project ID and endpoint in the Appwrite Console.
- [ ] Store the Appwrite API key as a protected GitHub Actions Secret; never paste it into chat or commit it.
- [ ] Run the manual bootstrap workflow and confirm a successful run.
- [ ] Verify the database, four tables, columns, and indexes in Appwrite Console.
- [ ] Implement authenticated Appwrite Functions for friend operations.
- [ ] Configure minimum required permissions and test unauthorized access.
- [ ] Test two separate accounts on two devices: lookup, request, accept, decline, cancel, notification, logout, and reconnect.
- [ ] Test duplicate and concurrent requests, self-requests, and attempts to act on another user's request.
- [ ] Add block/report and abuse controls before public release.
- [ ] Connect the frontend to the real backend and remove local storage as the source of truth.
- [ ] Verify any adult-only access restriction on the server before enabling that area.

## Important

This specification describes the intended Appwrite implementation. It does not itself deploy a backend or make the current preview's friend features live. Only successful deployment evidence and tests can change the status from planned to operational.
