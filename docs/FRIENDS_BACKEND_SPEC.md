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
- The bootstrap script targets the existing database and defines seven private TablesDB tables: `users`, `friend_requests`, `friendships`, `notifications`, `blocks`, `reports`, and `moderation_actions`.
- The TablesDB bootstrap verifies the existing database, creates seven private tables with columns and indexes, and verifies the resulting tables.
- Workflow #12 verified the original four tables, and workflow #13 verified all seven tables, including the moderation tables.
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


### `conversations`

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| `participantAId` | string | yes | First Auth user ID in canonical sorted order |
| `participantBId` | string | yes | Second Auth user ID in canonical sorted order |
| `createdAt` | datetime | yes | Server-generated creation time |
| `updatedAt` | datetime | yes | Server-generated update time |
| `lastMessageAt` | datetime | no | Server-generated last message timestamp |

A unique index on the canonical participant pair enforces one direct conversation per friendship.

### `messages`

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| `conversationId` | string | yes | Private conversation row ID |
| `senderId` | string | yes | Authenticated sender ID |
| `body` | string | yes | Plain text message, maximum 4,000 characters |
| `createdAt` | datetime | yes | Server-generated creation time |

Message rows are private and have empty row permissions. Only the authenticated conversation participants can read them through the Function.

### `notifications`

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| `recipientId` | string | yes | Auth user ID of recipient |
| `type` | string | yes | Server-validated notification type |
| `referenceId` | string | no | Related request or entity ID |
| `isRead` | boolean | yes | Read state |
| `createdAt` | datetime | yes | Server-generated creation time |

Additional collections, including temporary QR tokens, must be designed and reviewed before those features are enabled. The `blocks`, `reports`, and `moderation_actions` tables are now provisioned privately; their APIs and user-facing features are not deployed. Do not put permanent database IDs, email addresses, birth dates, or other private account data into QR codes.

## Permissions and trust boundaries

- Keep the collections private by default. The bootstrap script creates tables with empty table permissions and row-level security enabled; workflow #13 verified this for all seven tables.
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

## Friend Function scaffold status

The moderation Function scaffold now includes authenticated server-side routes for minimal NOX ID profile lookup, creating/listing/accepting/declining/cancelling friend requests, listing friendships, listing notifications, and marking a caller-owned notification as read. Request creation accepts a NOX ID rather than a client-supplied recipient Auth ID. Accept/cancel operations verify the caller's role as recipient/sender from the stored row. Profile lookup returns only NOX ID and display name. Creating and accepting requests call the shared bidirectional block guard. Creating a request writes a `friend_request` notification; accepting it writes a `friend_request_accepted` notification to the original sender. Notification listing and read updates are scoped to the caller's authenticated ID.

These routes are not deployed and have not been integration-tested against Appwrite. Profile lookup has no persistent rate limiter yet and must not be publicly exposed until rate limiting and anti-enumeration controls are added. Duplicate pending-request prevention currently uses read-before-write checks and is not safe against concurrent races. Friendship creation and request acceptance are sequential rather than transactional. Treat this as implementation scaffolding only; production enablement requires transaction or idempotency design, concurrency tests, Appwrite integration tests with two synthetic accounts, and verified SDK compatibility. Pure policy tests now cover NOX ID normalization, canonical friendship ordering, and sender/recipient authorization for request transitions; the latest GitHub Actions result has not yet been observed.


## Private messaging scaffold

The TablesDB bootstrap script now defines private `conversations` and `messages` tables. The authenticated Function scaffold includes:
- `POST /conversations` to create or retrieve a direct conversation with an existing friend.
- `GET /conversations` to list the caller's direct conversations.
- `GET /messages?conversationId=...` to retrieve the latest 50 messages.
- `POST /messages` to send plain text up to 4,000 characters.

Conversation participants are stored in canonical sorted order, with a unique pair index. Each read/send operation verifies caller membership, the ongoing friendship, and the bidirectional block guard. Message sender identity is always the authenticated Appwrite account, never a body field. A basic server-side limit of 30 messages per sender per minute is included.

This remains an un-deployed scaffold. The new tables have not yet been provisioned by rerunning the manual setup workflow, and no deployed Function, two-account integration test, Realtime delivery, pagination, attachments, edit/delete, or frontend connection exists yet. Message text must be safely rendered as text by any future client (never injected as HTML). The latest-50 response is a prototype contract, not a complete history pagination design.

## Block enforcement contract

A shared server-side helper is now present in `functions/moderation/src/policy.js` and exposed by the moderation store as `isBlocked(userAId, userBId)`. It checks both directed records in the private `blocks` table. Every future friend-request create/accept operation and every private-conversation send/open operation must call this guard using identities derived from the authenticated Appwrite session. If either direction is blocked, reject the operation without revealing which user created the block.

This helper is not yet wired into friend-request or messaging endpoints: those endpoints do not exist in the current backend. Do not treat the helper alone as end-to-end enforcement or enable client-side friend/message writes. Add integration tests for the actual endpoints before calling the feature operational.

## QR identity

A QR code must not contain a permanent database ID, email, date of birth, or other private data. Before QR friend adding is enabled, implement random, high-entropy, short-lived, revocable tokens. Store only a secure hash of each token. A scan must resolve to a minimal profile and require explicit confirmation before a friend request is created.

## Privacy and age eligibility

Collect only profile data needed by the product. Keep date of birth private and perform any age eligibility decision on the server. Any area restricted to adults must remain inaccessible unless eligibility is verified server-side; a frontend-only age prompt is not an access control. Do not expose birth dates or age in friend lookup responses.

## Test and release checklist

- [ ] Confirm the Appwrite project ID and endpoint in the Appwrite Console.
- [ ] Store the Appwrite API key as a protected GitHub Actions Secret; never paste it into chat or commit it.
- [x] Run the manual bootstrap workflow and confirm successful runs #12 and #13.
- [x] Verify all seven tables, columns, indexes, empty permissions, and row security through workflow #13 logs.
- [ ] Implement and deploy authenticated Appwrite Functions for friend and private-message operations.
- [ ] Provision the new private conversations and messages tables by rerunning the manual TablesDB setup workflow on the development branch.
- [ ] Configure minimum required permissions and test unauthorized access.
- [ ] Test two separate accounts on two devices: lookup, request, accept, decline, cancel, notification, logout, and reconnect.
- [ ] Test duplicate and concurrent requests, self-requests, and attempts to act on another user's request.
- [ ] Add block/report and abuse controls before public release.
- [ ] Connect the frontend to the real backend and remove local storage as the source of truth.
- [ ] Verify any adult-only access restriction on the server before enabling that area.

## Important

This specification describes the intended Appwrite implementation. It does not itself deploy a backend or make the current preview's friend features live. Only successful deployment evidence and tests can change the status from planned to operational.
