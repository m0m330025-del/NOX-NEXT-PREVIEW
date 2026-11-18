# NOX GUARD — Appwrite function setup

This source is a server-side foundation, not an active deployment. Do not point the public signup flow at it until the function is deployed, the database migration is applied, and integration tests pass.

## Function configuration

Create a separate Appwrite Function named `NOX-GUARD` in the existing Frankfurt project. Do not overwrite the current preview function.

- Runtime: Node.js 22 or a newer supported Node runtime compatible with the pinned `node-appwrite@31.3.0`.
- Repository root: repository root.
- Entrypoint: `server/nox-guard/appwrite-function.js`.
- Build command: `npm install`.
- Environment variable: `APPWRITE_DATABASE_ID=6afc583f00382386b997`.
- Execute permission: authenticated users only; the handler independently verifies the invoking JWT and user ID.
- Function API key scopes: read and write rows in the NOX_CORE database only. Do not grant project-wide account administration or user-management scopes.

Appwrite injects `x-appwrite-user-jwt`, `x-appwrite-user-id`, and an ephemeral `x-appwrite-key` into authenticated function executions. The function validates the JWT with the Account SDK and uses the ephemeral key only for TablesDB operations. Never copy these headers or keys into browser code or logs.

## Database migration

The idempotent bootstrap script adds three optional columns to the existing private `users` table:

- `ageBand`: starts as `unknown`; no date of birth is collected.
- `accountStatus`: new profiles start as `pending_review`.
- `role`: assigned by the server as `user`; clients cannot assign reviewer/admin.

The migration script is manual and requires the protected GitHub Actions secret `APPWRITE_API_KEY`. It has not been run as part of this code change. Existing tables remain private with row security enabled.

## Supported actions

Send an authenticated request to the function with the action in the query string or JSON body:

- `POST ?action=profile` with `{ "displayName": "..." }`: create an initial profile, always setting age band to unknown, status to pending review, and role to user.
- `GET ?action=me`: return the caller's profile.
- `POST ?action=report` with target profile ID, reason, and optional description.
- `POST ?action=block` / `POST ?action=unblock` with target profile ID.
- `GET ?action=block-check&targetUserId=...`: check blocks in either direction.

The function does not create Appwrite Auth accounts, enable public signup, approve pending profiles, assign reviewer/admin roles, or provide chat/message endpoints. The UI and every future interaction endpoint must call the server block check and enforce feature policy before interaction. Unknown age/status remains fail-closed for gated features.

## Required validation before launch

1. Deploy this function separately from the preview function.
2. Apply the schema migration only after reviewing the target database and backup.
3. Test authenticated and unauthenticated requests, profile creation, duplicate requests, report submission, block/unblock, and reverse-direction block checks against a staging project.
4. Add server-side moderation review and audited role assignment before granting reviewer/admin access.
5. Keep public signup disabled until eligibility and safety controls are reviewed for each launch jurisdiction.

This document is an implementation guide, not a claim of legal compliance or production readiness.
