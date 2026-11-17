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

### Review 004 — Reconcile current TablesDB state (2026-11-17)

**Scope**
- Current `scripts/setup-appwrite.mjs` and `.github/workflows/setup-appwrite.yml`
- GitHub Actions run #10, commit `147af307911a23132996adbb22d88e6e1fbba594`
- Current signup and login preview behavior

**Verified evidence**
- Workflow run #10 completed successfully.
- The workflow installed the pinned `node-appwrite@31.3.0` package and successfully imported `TablesDB`.
- The script connected to the configured `NOX_CORE` database and verified the four existing TablesDB tables: `users`, `friend_requests`, `friendships`, and `notifications`.
- The script reported the expected columns and indexes and completed with the message `NOX_CORE TablesDB bootstrap complete`.
- Table permissions were reported as empty and row-level security enabled by the bootstrap script. This is execution evidence from the script; it is not an independent Appwrite Console inspection or penetration test.
- The frontend login and signup pages remain demonstrations. They do not create Appwrite Auth sessions or accounts.

**Documentation correction**
- Review 003 above describes a DocumentsDB migration, but it does not match the current repository state or successful run #10.
- The active implementation is Appwrite **TablesDB**, not DocumentsDB. The Review 003 DocumentsDB statements are stale and must not be used as implementation instructions.
- The current backend is still only a provisioned schema. No authenticated friend Functions, live friend API, or realtime messaging have been deployed.

**Additional code-review observations**
- The bootstrap currently treats an HTTP 409 while creating an index as success, then prints `Created index`; this can make the log inaccurate on repeat runs. Improve the message and verify the existing index explicitly.
- For existing tables, the script fetches the table but does not independently assert that its permissions are empty and `rowSecurity` is enabled before printing the final security claim. Add explicit checks before treating an existing table as safe.
- The signup page performs a browser-side age check only. This must not be considered a security boundary or be connected to any restricted-area access decision. Eligibility checks, if required by product policy, must be performed by a trusted server and must not be bypassable by editing browser code.

**Decision**
- The four-table TablesDB bootstrap is verified as successful at workflow level.
- The application is not production-ready: authentication, trusted server operations, authorization, abuse controls, and realtime features remain unimplemented.
- Next engineering task: harden the bootstrap's verification/logging, then design and deploy a minimal authenticated backend operation with least-privilege permissions. Keep the existing tables private; do not enable public client writes.
- This is an AI-assisted static/code and workflow review, not a human engineering sign-off or external security audit.

### Review 005 — Bootstrap security assertions and repeat-run logs (2026-11-17)

**Changes committed**
- The bootstrap now fetches each table's persisted configuration and stops unless `rowSecurity === true` and `permissions` is an empty array.
- Index creation now distinguishes a newly created index from an index that already exists after an HTTP 409 conflict; it no longer labels both cases as newly created.

**Verification status**
- Static source update committed in `scripts/setup-appwrite.mjs`.
- These new assertions have **not yet been executed against Appwrite**. A fresh manual `workflow_dispatch` run is required to verify the SDK response shape and the existing table settings.
- Until that run succeeds, treat Review 005 as a code change awaiting CI/runtime verification, not as a passed deployment check.
