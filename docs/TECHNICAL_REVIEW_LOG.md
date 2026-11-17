# NOX NEXT — Technical Review Log

## Review 001 — 2026-11-17

**Scope**
- `scripts/setup-appwrite.mjs`
- `.github/workflows/setup-appwrite.yml`
- `core/appwrite-config.js`
- `docs/FRIENDS_BACKEND_SPEC.md`

**Review type**
AI-assisted technical review against Appwrite SDK usage patterns, backend security boundaries, schema readiness, and deployment safety. This is not an external human security audit or a penetration test.

### Findings and actions

| Severity | Finding | Action / status |
|---|---|---|
| High | The bootstrap script created attributes and indexes sequentially without waiting for Appwrite's asynchronous schema operations to become available. | Fixed in `scripts/setup-appwrite.mjs`: poll attribute/index status and stop on failure or timeout. |
| High | The friend backend specification described PostgreSQL tables and SQL migrations, conflicting with the selected Appwrite architecture. | Rewritten as an Appwrite-native specification. The old SQL migration must not be run for this backend. |
| High | Collections are private by default, but actual authenticated server functions and narrowly scoped access rules are not implemented. | Documented as a deployment blocker; no claim that friend operations are live. |
| Medium | The configured Appwrite project ID has not been confirmed against the Appwrite Console. | Must be verified by the project owner before running the workflow. |
| Medium | The schema bootstrap creates only the initial four collections; QR token, block, and report data models are not yet implemented. | Documented as future reviewed work before enabling those features. |
| Medium | Duplicate pending friend requests cannot be safely prevented by the current non-unique lookup indexes alone. | Server-side concurrency-safe validation is required and documented. |

| Medium | The previous SQL migration remained executable despite the Appwrite architecture decision. | Replaced its contents with a retirement notice so it cannot accidentally create an unrelated PostgreSQL backend. |
| Medium | Workflow installed an unpinned SDK version and did not fail early when its required secret was absent. | Pin SDK to 31.3.0, add a missing-secret preflight, and serialize bootstrap runs. |
| Low | Notification read-state was optional in the bootstrap schema but required in the specification. | Set `isRead` as a required boolean attribute. |

### Files changed

- `scripts/setup-appwrite.mjs` — wait for schema attributes and indexes to become available.
- `docs/FRIENDS_BACKEND_SPEC.md` — replace PostgreSQL-only guidance with Appwrite architecture, data model, permissions, function contract, and release checks.
- `.github/workflows/setup-appwrite.yml` — pin the Node SDK, check for the required secret, and prevent overlapping bootstrap runs.
- `db/migrations/001_friends_schema.sql` — retire the obsolete PostgreSQL migration to prevent accidental execution.
- `scripts/setup-appwrite.mjs` — make notification `isRead` required, matching the specification.

### Review 002 — workflow hardening

- Pinned the bootstrap dependency to `node-appwrite@31.3.0` rather than installing an unbounded latest version. The package release notes identify this SDK line as targeting Appwrite Cloud server 2.7.x.
- Added an explicit missing-secret check before installation or deployment steps.
- Added a concurrency group so two manual schema bootstraps cannot overlap.
- Made `notifications.isRead` required, matching the documented data model.
- Replaced the retired PostgreSQL SQL migration with a clear non-executable notice.

### Not yet verified

- GitHub Actions workflow execution. Repository Actions history currently shows no run for `setup-appwrite.yml`.
- Presence and correctness of the `APPWRITE_API_KEY` GitHub Secret.
- Existence of the Appwrite project and database.
- Successful creation of collections, attributes, and indexes in the live Appwrite project.
- Authenticated functions, permission tests, realtime behavior, and cross-device tests.

**Decision:** The bootstrap code has received two rounds of AI-assisted static review and the identified issues above have been corrected in the repository. This is not an external human review. The backend is **not approved for production** until the remaining deployment and security tests pass.


### Review 003 — DocumentsDB API alignment (2026-11-17)

**Official documentation checked**
- Appwrite DocumentsDB is schemaless: collections do not define SQL-like columns or pre-created attributes.
- The current Node Server SDK examples instantiate `DocumentsDB`, then call `create`, `createCollection`, and `createIndex`.
- The current API reference assigns `documentsdb.write` to database creation. The matching DocumentsDB read/write, collection read/write, and index read/write scopes are the least-privilege set needed by this bootstrap's create/get/verify flow.

**Finding**
- The previous bootstrap imported `Databases` and attempted to create string, datetime, and boolean attributes. That is the TablesDB-style schema workflow, not the current DocumentsDB model.

**Action**
- Replaced the bootstrap with `DocumentsDB` and schemaless collections.
- Retained private collection permissions and document-level security.
- Kept indexes for the documented lookup patterns and wait-for-index readiness checks.
- A 409 conflict is now accepted only after fetching the existing resource successfully.
- No live Appwrite calls were made; the script remains unexecuted until the protected GitHub secret is configured.

**Remaining verification**
- Confirm the installed `node-appwrite@31.3.0` exports `DocumentsDB` and `DocumentsDBIndexType` as used by the script, via CI's pinned install and a safe syntax/import check.
- Execute the bootstrap once the owner adds the secret, then inspect actual database/collection/index state.
- Continue with authenticated Functions and permission tests before frontend integration.

**Decision:** Static design now follows the current official DocumentsDB API shape. This is an AI-assisted review, not a human engineering sign-off or external security audit.
