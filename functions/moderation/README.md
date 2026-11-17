# NOX moderation Functions — scaffold only

This package is a **non-production scaffold** for the NOX moderation API.

## Runtime

- Appwrite Functions, Node.js 22
- Entrypoint: `src/index.js`
- Install command: `npm install`
- Dependency: `node-appwrite@31.3.0`

## Security behavior included

- Requires the Appwrite-injected `x-appwrite-user-jwt` header.
- Uses the JWT with the Server SDK and calls `Account.get()` before routing.
- Derives the caller's identity from the authenticated Appwrite account.
- Validates report reason, content type, identifiers, and description length.
- Rejects self-blocking.
- Does not log request bodies, report descriptions, or credentials.

## Protected Function environment

Configure these values in the Appwrite Function's protected environment settings, never in frontend code or Git:
- `NOX_MODERATION_API_KEY`: a dedicated server API key with only `rows.read` and `rows.write` scopes. Appwrite scopes apply at project level, not individual table level, so this key can technically access rows in other project tables too; keep it server-only, use a separate dedicated key, and review this broader access before any production deployment.
- `NOX_DATABASE_ID`: optional; defaults to the existing `NOX_CORE` database ID.
- `NOX_MODERATOR_USER_IDS`: optional comma-separated Auth user IDs; leave unset until moderator identities are formally approved.

The API key is not committed and is not supplied by this repository. Without it, persistence fails closed with a service-unavailable response. Appwrite's API key scope model is documented at https://appwrite.io/docs/partners/project/api-keys.

## Implemented routes in the scaffold

All routes require an Appwrite user JWT and derive the caller ID from the verified Appwrite session:
- `POST /blocks` with `targetUserId`
- `DELETE /blocks` with `targetUserId` (only removes the caller's own block)
- `GET /blocks` (only the caller's own list)
- `POST /reports` (account reports only; server sets reporter, status, and timestamps)
- `GET /reports` (only the caller's own safe report summaries)

Rows are written with empty row permissions. These routes do not grant browser access to TablesDB. The current store writes rows server-side using the dedicated function API key; this has not yet been verified against a deployed Appwrite Function or tested end-to-end against the live database.

## Friend endpoints added to the scaffold

The authenticated Function router now contains these private server-side routes:
- `POST /friends/requests` with `noxId` (normalized on the server)
- `GET /friends/requests?direction=incoming|outgoing`
- `POST /friends/requests/respond` with `requestId` and `decision=accept|decline`
- `POST /friends/requests/cancel` with `requestId`
- `GET /friends`
- `GET /friends/lookup?noxId=...` returns only `noxId` and `displayName`
- `GET /notifications` lists notifications belonging to the authenticated caller
- `POST /notifications/read` marks a caller-owned notification as read

The store derives the sender/actor from the verified Appwrite JWT, checks the bidirectional block guard before creating or accepting a request, writes rows with empty permissions, and creates notifications for new and accepted requests. Notification reads and updates are scoped to the authenticated recipient. Profile lookup returns only a minimal public projection. This is still scaffold code: it has not been deployed or integration-tested against Appwrite. Duplicate-request checks are read-then-write and are not transactionally race-safe; do not expose these routes in production until concurrency controls/transaction behavior are implemented and tested. Profile lookup currently has no persistent rate limiter. Do not expose it publicly until per-caller rate limiting and anti-enumeration controls are implemented and tested.


## Private conversation and message endpoints (scaffold)

The same authenticated Function now contains:
- `POST /conversations` with `friendUserId`: create or return the one-to-one conversation for an existing friend.
- `GET /conversations`: list conversations in which the authenticated caller is a participant.
- `GET /messages?conversationId=...`: return the latest 50 messages for a conversation.
- `POST /messages` with `conversationId`, `body`, and a client-generated UUID `idempotencyKey`: send a text message (maximum 4,000 characters).

The server derives the sender from the Appwrite JWT, requires a confirmed friendship, checks blocks in both directions on every conversation/message operation, verifies conversation membership, writes message rows with empty permissions, and applies a basic server-side limit of 30 messages per sender per minute. The message row ID is the validated client UUID, so network retries and concurrent duplicate submissions resolve to the same row; reusing a key with different sender/conversation/body returns `409 idempotency_key_conflict`. A retry also repairs the conversation last-message timestamp if the initial write succeeded but the conversation update failed. The schema bootstrap now defines private `conversations` and `messages` tables with a canonical unique participant-pair index and message lookup indexes.

This is not a live chat service: the tables must first be provisioned by manually running the existing `Setup Appwrite NOX_CORE TablesDB` workflow on this branch. No Function has been deployed, and no Appwrite integration test, two-account test, Realtime delivery, pagination, message editing/deletion, or end-to-end UI connection has been completed. Do not enable browser-side database access. The current endpoint returns the latest 50 messages only. Clients must generate one UUID per intended message and reuse that same key for every retry; never generate a fresh key just because a request timed out.

## Intentionally not enabled

Moderator review/action routes still return `501 not_implemented`. Message/profile reports are rejected until their source content and authorization model are implemented. Moderator routes use an exact-match allowlist from the protected Function environment variable `NOX_MODERATOR_USER_IDS` (comma-separated Appwrite Auth user IDs). Missing or malformed configuration fails closed. Provision this variable only through the Appwrite Console or approved secret-management process; never put it in the repository or browser. This is deliberate: the private TablesDB tables exist and the scaffold contains server-side row persistence for account reports and user blocks, but the persistence path has not yet been integration-tested against a deployed Function. Moderator review/actions, approved moderator membership, appeals/retention policy, and end-to-end enforcement in friend requests, messages, and presence are not implemented.

Do not grant broad table permissions or deploy this scaffold as a live moderation service. Before implementation continues, define and review:
1. Provision `NOX_MODERATOR_USER_IDS` through protected Appwrite Function configuration, with a documented owner approval and periodic access review.
2. Replace or further constrain the project-wide `rows.read` / `rows.write` API key scopes where Appwrite's scope model permits; do not mistake these scopes for table-level isolation.
3. Deploy only to a non-production Appwrite Function environment and integration-test row create/list/delete against synthetic accounts.
4. The full set of private-message, friend-request, and presence endpoints that must enforce blocks in both directions.
5. Report retention, appeal, and reviewer access rules.

## Local tests

From this directory:

```sh
npm install
npm test
```

Tests use synthetic IDs and do not connect to Appwrite.


Source validation is part of CI: the workflow currently runs policy tests and Node.js syntax checks for all three source modules. These are not database integration tests. The latest verified run is GitHub Actions run `44112983985` on the current branch head.
