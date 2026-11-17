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

### Files changed

- `scripts/setup-appwrite.mjs` — wait for schema attributes and indexes to become available.
- `docs/FRIENDS_BACKEND_SPEC.md` — replace PostgreSQL-only guidance with Appwrite architecture, data model, permissions, function contract, and release checks.

### Not yet verified

- GitHub Actions workflow execution.
- Presence and correctness of the `APPWRITE_API_KEY` GitHub Secret.
- Existence of the Appwrite project and database.
- Successful creation of collections, attributes, and indexes in the live Appwrite project.
- Authenticated functions, permission tests, realtime behavior, and cross-device tests.

**Decision:** The bootstrap code has received an initial static review and two corrections have been committed. The backend is **not approved for production** until the remaining deployment and security tests pass.
