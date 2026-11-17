# NOX NEXT — Appwrite Compatibility Review for Jewels

**Status:** AI-assisted technical review; design only, not a human engineering sign-off.
**Reviewed branch:** `feature/moderation-functions-scaffold`
**Reviewed SDK pin:** `node-appwrite@31.3.0`
**Reviewed database:** Existing `NOX_CORE` TablesDB configuration in the repository.
**No Appwrite resources were created or modified during this review.**

## 1. Findings from the repository

### Existing database bootstrap

`scripts/setup-appwrite.mjs`:
- Connects to the existing `NOX_CORE` database; it does not create or delete the database.
- Uses `TablesDB` from `node-appwrite`.
- Creates private tables with empty table permissions and `rowSecurity: true`.
- Reconciles columns and indexes on retries.
- Supports `varchar`, `datetime`, and `boolean` columns in its current column factory.
- Creates unique and regular indexes through `db.createIndex`.
- Does not currently define jewels, jewel events, or jewel conversion tables.
- Does not currently create or test a database transaction.

### Existing runtime/package alignment

- Root `package.json` permits Node `>=22 <27`.
- `functions/moderation/package.json` declares Node `>=22 <23`.
- The deployed Appwrite Function was previously identified in project notes as Node 26.
- This is a package-engine mismatch that must be resolved and tested before a backend deployment. Do not change the deployed runtime as an incidental part of jewels work.

## 2. TablesDB transaction capability

The current official Appwrite TablesDB documentation describes transaction support:
1. Create a transaction with `TablesDB.createTransaction()`.
2. Stage supported row operations using the transaction ID, or use `createOperations()`.
3. Commit with `updateTransaction({ transactionId, commit: true })`, or roll back.
4. A conflicting external change to an affected row causes commit failure rather than silently applying both writes.

The pinned `node-appwrite@31.3.0` package targets Appwrite Cloud server 2.7.x according to its published package documentation. The current TablesDB server reference exposes transaction endpoints.

**Compatibility conclusion:** The repository's SDK family and current Appwrite Cloud TablesDB API appear to provide the primitives needed for an atomic multi-table jewels conversion. However, this review cannot verify the exact server build and transaction behavior of the live `NOX_CORE` project because no authenticated Appwrite Console/API inspection or live transaction test was performed.

## 3. Recommended conversion transaction

A conversion should be one short transaction affecting at least:
- the user's `jewel_accounts` row;
- one new immutable `jewel_conversions` receipt;
- the central NXC wallet row;
- the central wallet ledger entry (or the project's existing equivalent).

Recommended sequence:
1. Authenticate the caller and derive the user ID from the verified session.
2. Validate a positive even integer jewel amount and an idempotency key.
3. Check for an existing receipt for the same user and idempotency key. If found, return that receipt only when the request parameters match.
4. Read the current account and wallet state.
5. Create a TablesDB transaction.
6. Stage a guarded/conditional balance update strategy so concurrent requests touching the same jewel-account or wallet row conflict instead of overspending.
7. Stage the immutable conversion receipt and matching wallet ledger credit in the same transaction.
8. Commit. If any stage or commit fails, roll back where possible and return no success response.
9. On a retry after an uncertain network result, look up the idempotency receipt before attempting a new credit.

Do not assume that a read performed before transaction creation is itself locked. Concurrency safety must rely on transaction conflict detection and/or a verified conditional update strategy, and must be proven with concurrent integration tests.

## 4. Schema/index compatibility notes

The existing bootstrap already supports the private-table and index patterns needed for a jewels schema. Proposed indexes:
- `jewel_accounts`: unique `userId`.
- `jewel_events`: unique `sourceGiftId`; lookup index on `userId, createdAt`.
- `jewel_conversions`: unique `conversionId`; composite unique `userId, idempotencyKey`; lookup index on `userId, createdAt`.

Before adding tables:
- Confirm the exact maximum index-column count and column-key constraints for the live TablesDB version.
- Confirm unique composite index behavior with the deployed service.
- Extend the setup script's schema definition only after a reviewed migration plan exists.
- Preserve empty table permissions and `rowSecurity: true`; all writes remain server-side.

## 5. Critical design correction: account balance source of truth

The jewels specification currently describes both immutable event records and cached account totals. The implementation must define one consistent accounting rule:
- immutable jewel-award and conversion records are the audit history;
- the account row is the operational balance used for atomic spending;
- every account-row mutation must be committed in the same transaction as its corresponding immutable event;
- reconciliation must be able to rebuild and compare account totals from the event history.

Never update a cached balance outside the transaction that creates its corresponding event.

## 6. Required verification before implementation

1. Confirm live Appwrite Cloud server/API compatibility for TablesDB transactions.
2. Verify the SDK methods exist in the exact installed `node-appwrite@31.3.0` dependency.
3. Run an isolated test transaction that creates/updates rows across the required tables and then rolls back.
4. Run a commit test and confirm all rows become visible together.
5. Run concurrent conversion attempts against the same jewel account; only valid non-overlapping spending may commit.
6. Simulate a lost client response after commit and prove idempotent retry returns the original receipt without a second NXC credit.
7. Verify unique indexes reject duplicate gift award IDs and duplicate user/idempotency pairs.
8. Resolve the Node 26 versus nested package engine mismatch and run the full test suite before any function deployment.

## 7. Deployment boundary

The Appwrite Function is connected to the GitHub branch. Backend commits may trigger a redeploy. This review deliberately changed no backend code, schema, function configuration, environment variables, or runtime.

**Decision:** Proceed to a reviewed schema migration and isolated integration tests only after the verification gates above are satisfied. Do not enable production jewel conversion based solely on this document.
