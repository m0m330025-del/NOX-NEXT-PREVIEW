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
| High | The bootstrap script created attributes and indexes sequentially without waiting for Appwrite's asynchronous schema operations to become available. | Fixed: poll schema status and stop on failure or timeout. |
| High | The friend backend specification described PostgreSQL tables and SQL migrations, conflicting with Appwrite. | Rewritten as an Appwrite-native specification. |
| High | Authenticated friend Functions and narrowly scoped access rules are not implemented. | Deployment blocker; no claim that friend operations are live. |
| Medium | QR token, block, and report data models are not implemented. | Must be reviewed before enabling those features. |
| Medium | Duplicate pending friend requests cannot be safely prevented by lookup indexes alone. | Concurrency-safe server validation is required. |
| Medium | The previous SQL migration remained executable. | Retired to prevent accidental creation of an unrelated PostgreSQL backend. |
| Medium | Workflow dependency was unpinned and missing-secret checks were absent. | Pinned SDK to 31.3.0, added preflight, and serialized bootstrap runs. |
| Low | Notification read-state did not match the specification. | Made `isRead` required. |

### Review 002 — Workflow hardening

- Pinned `node-appwrite@31.3.0`.
- Added an explicit missing-secret check.
- Added a concurrency group.
- Made `notifications.isRead` required.
- Retired the obsolete PostgreSQL migration.

### Review 003 — Historical DocumentsDB investigation

This section records an earlier investigation only. It is superseded by Review 004: the active implementation is **Appwrite TablesDB**, not DocumentsDB. Do not use the old DocumentsDB notes as implementation instructions.

### Review 004 — Reconcile current TablesDB state

- Confirmed the repository uses Appwrite TablesDB.
- Confirmed the frontend login and signup pages were demonstrations and did not create Appwrite Auth sessions or accounts.
- Identified that the browser-only age check was not a security boundary.
- Required private tables, trusted server operations, and server-side eligibility checks before protected access.

### Review 005 — Bootstrap security assertions

- Added checks for private tables and enabled row security.
- Improved repeat-run index verification.
- Runtime verification was pending at the time of the change.

### Review 006 — Correct Appwrite Table model field

- Workflow #11 failed because the Appwrite Table model exposes table permissions as `$permissions`, not `permissions`.
- Corrected the assertion to check `verifiedTable.$permissions` and require an empty array.
- Official model reference: https://appwrite.io/docs/references/cloud/models/table
- Correction commit: `91d5b73d7d3368e4b6ca761f3207ed4d9ac68c38`.

### Review 007 — Successful TablesDB verification (2026-11-17)

**Verified execution**
- Workflow run #12 completed with conclusion `success`.
- Run ID: `44109908973`.
- Commit checked out: `8f9c7516fca92a29593fc8ca669b216b3948eb78`.
- The workflow imported the pinned TablesDB SDK and connected to the configured `NOX_CORE` database.
- It verified all four tables: `users`, `friend_requests`, `friendships`, and `notifications`.
- It verified the expected columns and indexes, empty table permissions, and `rowSecurity` enabled.
- The log ended with: `All tables have empty table permissions and rowSecurity enabled.`
- No public access or friend APIs were enabled.

**Remaining boundary**
- This verifies the schema bootstrap only. It does not prove that Auth, account creation, session handling, friend operations, realtime, or cross-device behavior are deployed.
- The current signup/login pages remain previews. Do not treat browser-only age checks as eligibility verification.
- The authentication and eligibility design is documented in `docs/AUTH_SECURITY_SPEC.md`. It is a design checklist, not a deployed verification service.

**Decision**
The four-table Appwrite TablesDB bootstrap is verified at workflow level. The application is not production-ready. Keep account access and protected operations disabled until a trusted server-side eligibility design, authentication boundary, authorization rules, and security tests are implemented. This is AI-assisted technical review, not an independent security audit.


### Review 008 — Blocking, reporting, and moderation design (2026-11-17)

- Added `docs/MODERATION_BLOCKING_SPEC.md` as a design-only specification.
- Distinguished user-to-user blocks, moderator-issued account restrictions, and temporary automated protective limits.
- Defined proposed TablesDB models for blocks, reports, and append-only moderation actions; no tables or permissions were changed.
- Required trusted server-side identity and authorization, private row-secured data, two-way block checks on interaction endpoints, and moderator-only actions.
- Added privacy, evidence-minimization, appeal, retention, and pre-release test requirements.
- No block/report APIs, moderator dashboard, automated enforcement, or account suspension capability was deployed by this documentation change.

**Decision**
The moderation design is documented but not operational. Review proposed schemas and permission rules before changing the Appwrite bootstrap workflow. Keep all protected access behind the existing authentication and eligibility release gates.


### Review 009 — Moderation schema review (2026-11-17)

- Reviewed the proposed `blocks`, `reports`, and `moderation_actions` TablesDB schemas against the moderation design.
- Added bounded text fields, server-owned identity/status fields, and lookup indexes for user history and moderator queues.
- The bootstrap remains idempotent and provisions tables with empty table permissions and row security enabled, matching the existing private-table assertions.
- This change provisions schema only. It does not create Functions, grant client access, create moderator roles, or enable blocking/reporting/suspension behavior.
- Before running the workflow, review Appwrite's resulting schema and keep all client permissions closed.

**Decision**
The three tables are ready for private schema provisioning. Feature activation remains blocked pending trusted backend enforcement, role checks, retention/appeal handling, and security tests.


### Review 010 — Moderation tables provisioned and Functions boundary defined (2026-11-17)

**Verified execution**
- Workflow `Setup Appwrite NOX_CORE TablesDB` run #13 completed successfully.
- Run ID: `44111416915`; checked-out commit: `22bfa24`.
- The execution logs verified all seven tables: `users`, `friend_requests`, `friendships`, `blocks`, `reports`, `moderation_actions`, and `notifications`.
- The logs verified expected columns and indexes, empty table permissions, and row-level security enabled for each table.
- The run's Node.js 20 and Ubuntu runner notices were deprecation/migration notices, not execution failures.

**Implementation planning**
- Expanded `docs/MODERATION_BLOCKING_SPEC.md` with the Appwrite Functions trust boundary: require and validate the invoking user's JWT, derive caller identity server-side, verify moderator roles server-side, and keep privileged function keys scoped and private.
- Updated `docs/FRIENDS_BACKEND_SPEC.md` to reflect the seven-table verified state.
- No Functions, client permissions, account sessions, or moderation user flows were deployed or enabled by this review.

**Decision**
The seven-table private schema is provisioned and verified. Blocking, reporting, moderation actions, authentication, and friend APIs remain non-operational until separately implemented and tested. Adult-only access remains disabled pending the independent server-side eligibility release gate. This is an AI-assisted technical review, not an independent security audit.
