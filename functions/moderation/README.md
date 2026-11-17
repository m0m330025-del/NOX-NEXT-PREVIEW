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

## Intentionally not enabled

Every write/read route currently returns `501 not_implemented`. Moderator routes use an exact-match allowlist from the protected Function environment variable `NOX_MODERATOR_USER_IDS` (comma-separated Appwrite Auth user IDs). Missing or malformed configuration fails closed. Provision this variable only through the Appwrite Console or approved secret-management process; never put it in the repository or browser. This is deliberate: the private TablesDB tables exist, but row persistence, moderator membership, appeals/retention policy, and end-to-end enforcement have not yet been implemented.

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
