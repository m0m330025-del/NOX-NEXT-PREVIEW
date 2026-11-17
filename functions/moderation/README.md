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
- `NOX_MODERATION_API_KEY`: a dedicated server API key with only the database row read/write scopes required for `users`, `blocks`, and `reports`.
- `NOX_DATABASE_ID`: optional; defaults to the existing `NOX_CORE` database ID.
- `NOX_MODERATOR_USER_IDS`: optional comma-separated Auth user IDs; leave unset until moderator identities are formally approved.

The API key is not committed and is not supplied by this repository. Without it, persistence fails closed with a service-unavailable response.

## Implemented routes in the scaffold

All routes require an Appwrite user JWT and derive the caller ID from the verified Appwrite session:
- `POST /blocks` with `targetUserId`
- `DELETE /blocks` with `targetUserId` (only removes the caller's own block)
- `GET /blocks` (only the caller's own list)
- `POST /reports` (account reports only; server sets reporter, status, and timestamps)
- `GET /reports` (only the caller's own safe report summaries)

Rows are written with empty row permissions. These routes do not grant browser access to TablesDB.

## Intentionally not enabled

Moderator review/action routes still return `501 not_implemented`. Message/profile reports are rejected until their source content and authorization model are implemented. Moderator routes use an exact-match allowlist from the protected Function environment variable `NOX_MODERATOR_USER_IDS` (comma-separated Appwrite Auth user IDs). Missing or malformed configuration fails closed. Provision this variable only through the Appwrite Console or approved secret-management process; never put it in the repository or browser. This is deliberate: the private TablesDB tables exist, but row persistence, moderator membership, appeals/retention policy, and end-to-end enforcement have not yet been implemented.

Do not grant broad table permissions or deploy this scaffold as a live moderation service. Before implementation continues, define and review:
1. Provision `NOX_MODERATOR_USER_IDS` through protected Appwrite Function configuration, with a documented owner approval and periodic access review.
2. Minimal server-side TablesDB scopes and row access strategy.
3. The full set of private-message, friend-request, and presence endpoints that must enforce blocks in both directions.
4. Report retention, appeal, and reviewer access rules.

## Local tests

From this directory:

```sh
npm install
npm test
```

Tests use synthetic IDs and do not connect to Appwrite.
