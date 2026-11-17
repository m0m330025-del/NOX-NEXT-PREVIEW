# NOX Moderation API — Appwrite staging deployment

This deploys the current scaffold as an isolated **staging Function**. It does not change the production app or grant browser access to TablesDB.

## Function settings

| Setting | Value |
|---|---|
| Name | NOX Moderation API (Staging) |
| Function ID | `nox-moderation-api` |
| Runtime | Node.js 22 (`node-22`) |
| Git repository | `m0m330025-del/NOX-NEXT-PREVIEW` |
| Git branch | `feature/moderation-functions-scaffold` |
| Root directory | `functions/moderation` |
| Entrypoint | `src/index.js` |
| Build command | `npm install` |
| Execute access | Authenticated users only (`users`); do not enable public/anonymous access |
| Deployment path filter | `functions/moderation/**` |

Use this feature branch as the deployment branch for this **separate staging Function**. Appwrite documents that commits to the configured production branch activate deployments, while commits to other branches create inactive deployments.

## Protected environment variables

Configure these in Function > Settings > Variables. Mark the API key as secret/protected.

- `NOX_MODERATION_API_KEY`: a dedicated Appwrite API key with only the `rows.read` and `rows.write` scopes required by this scaffold.
- `NOX_DATABASE_ID`: `6afc583f00382386b997` (the existing `NOX_CORE` TablesDB database ID).

Do not copy an API key into this repository, source code, a commit, an issue, or chat. Do not reuse the bootstrap key automatically: create a dedicated Function key and review its scopes. Appwrite scopes are project-wide, not table-specific, so even this key can access rows in other project tables; keep it server-only.

The Appwrite-provided runtime variables `APPWRITE_FUNCTION_API_ENDPOINT` and `APPWRITE_FUNCTION_PROJECT_ID` are read automatically by the code and should not be manually overridden.

## First deployment verification

1. Confirm the existing `NOX_CORE` TablesDB tables are present.
2. Create the Function with the settings above and connect it to the repository.
3. Add the protected variables.
4. Wait for the first deployment build to finish successfully.
5. In the Function execution settings, allow authenticated users only.
6. Test first with a signed-in test account. Verify an unauthenticated request is rejected and a signed-in request without the server API key fails closed with `503`.
7. Only after the dedicated key is configured, test friend/conversation/message routes using two test accounts. Do not use real users or real personal messages for initial tests.

## Current limitations

This repository's moderation package is still a scaffold, not a production-ready chat service. A successful build is not proof of live database integration. Two-account integration tests, transaction/concurrency verification, persistent lookup rate limiting, Realtime delivery, pagination, and message edit/delete remain outstanding. Keep this Function isolated from production until those tests and security review pass.
