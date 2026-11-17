# NOX NEXT — Wallet & Jewels Integration Test Specification

**Status:** Test specification only. No wallet/jewels tests have been executed against production data.
**Branch:** `feature/moderation-functions-scaffold`

## 1. Current test coverage

The current `test/appwrite-transactions.integration.test.js` verifies commit and rollback for one update to one `friend_requests` row. It does not verify:
- multiple rows across multiple tables in one transaction;
- a balanced NXC ledger;
- wallet balance invariants under concurrent requests;
- jewel debit and NXC credit atomicity;
- idempotency under retries;
- unique index behavior for the proposed wallet/jewels schema.

The current GitHub Actions workflow runs integration tests using Node 22. The root package range is Node 22–26, while `functions/moderation/package.json` declares `>=22 <23`. The deployed Appwrite Function was previously identified as Node 26. This is a deployment compatibility question, not something this test plan assumes away.

## 2. Required isolated test environment

Before implementing these tests, provision a dedicated non-production Appwrite database/project with:
- the same TablesDB service version and pinned `node-appwrite@31.3.0`;
- private tables and row security enabled;
- only disposable test users and rows;
- a dedicated API key restricted to the test project;
- cleanup in `finally` blocks and unique test IDs.

Never run destructive tests against production wallet rows or real user balances.

## 3. Core test matrix

| ID | Scenario | Expected result |
|---|---|---|
| WAL-001 | Create one wallet for a user | Exactly one wallet row; duplicate user wallet rejected |
| WAL-002 | Commit a two-sided internal transfer | Sender debit, recipient credit, transaction envelope and ledger rows all visible |
| WAL-003 | Roll back a staged transfer | No balance or ledger changes visible |
| WAL-004 | Transfer more than available balance | Rejected; no partial writes |
| WAL-005 | Two concurrent debits competing for same balance | At most affordable debit(s) commit; balance never negative |
| WAL-006 | Replay same idempotency key and same payload | Original result returned; no second ledger posting |
| WAL-007 | Reuse idempotency key with different payload | Conflict; no new posting |
| WAL-008 | Duplicate provider payment event | Only one top-up credit |
| WAL-009 | Ledger debit/credit totals | Every committed transaction balances |
| JWL-001 | Complete qualifying gift worth 100 NXC for eligible female recipient | 100 jewels awarded exactly once |
| JWL-002 | Retry same completed gift event | No duplicate jewel award or progression contribution |
| JWL-003 | Failed gift attempt | No wallet debit, gift completion, progression, or jewels |
| JWL-004 | Convert 20 jewels | 20 jewels debited and 10 NXC credited to the existing wallet |
| JWL-005 | Convert with 21 jewels available | 20 converted; 1 jewel remains |
| JWL-006 | Request odd conversion amount | Rejected; no writes |
| JWL-007 | Two simultaneous conversions against 20 jewels | Total debit cannot exceed 20; only one 10-NXC credit |
| JWL-008 | Replay conversion idempotency key | Same receipt; no duplicate NXC credit |
| JWL-009 | Force failure after staged jewel debit but before commit | Entire transaction rolled back; wallet and jewels unchanged |
| JWL-010 | Verify progression after conversion | Historical received-gift progression remains unchanged |
| SEC-001 | Client attempts direct table write | Denied by permissions |
| SEC-002 | Client supplies another user ID or arbitrary reward amount | Ignored/rejected; server identity and catalog snapshot used |
| SEC-003 | Attempt normal cancellation of completed gift | No cancellation route or mutation exists |

## 4. Atomic multi-table transaction proof

A dedicated integration test must create disposable rows and stage the following in a single Appwrite transaction:
1. Update the test user's jewel account.
2. Update that same user's canonical NXC wallet.
3. Create a jewel conversion receipt.
4. Create the matching immutable NXC ledger entries.
5. Create the transaction envelope.

Before commit, ordinary reads must see none of the staged changes. After commit, all changes must be visible. In the rollback variant, none may be visible.

If Appwrite's transaction API or service constraints cannot guarantee this exact behavior, conversion stays disabled. Do not simulate atomicity with sequential independent writes.

## 5. Concurrency and idempotency proof

- Use a barrier so two test requests begin from the same starting balance.
- Both requests attempt to convert the same available jewels.
- Verify the committed jewel debit never exceeds the starting balance.
- Verify the NXC wallet is credited by exactly half the committed jewel debit.
- Verify the sum of committed conversion receipts matches the ledger.
- Repeat one request using the same idempotency key after intentionally dropping the first response.
- Confirm only one transaction reference and one wallet credit exist.

A unique index is necessary but may not alone be sufficient to prevent lost updates. The test must prove the actual transaction/conflict behavior of the deployed Appwrite service.

## 6. Integer and bounds validation

Before creating the schema, verify the pinned SDK and live service support the selected integer column method. Tests must reject:
- negative values;
- zero or odd jewel conversion amounts;
- non-integer values;
- values beyond the supported safe application range;
- overflow when adding balances or cumulative totals.

Use integer NXC and jewel amounts only. Never use floating-point arithmetic for balances.

## 7. Required CI gates

The GitHub Actions workflow should eventually run:
1. static syntax checks;
2. unit tests for validation and ledger balancing;
3. Appwrite integration tests against the isolated test database;
4. multi-table commit/rollback test;
5. concurrency/idempotency tests;
6. cleanup verification.

A skipped integration test must be reported as skipped, never as a passing live verification.

## 8. Go/no-go criteria

**GO** only if every required test passes on the same Appwrite service/runtime combination intended for deployment, all ledger transactions balance, concurrent requests cannot overspend, and retries cannot duplicate credits.

**NO-GO** if atomicity is unproven, integration tests are skipped, unique indexes are absent, runtime compatibility is unresolved, or any partial wallet/jewel mutation can survive a failed operation.

## 9. Deployment and data safety

This specification does not alter schemas, function code, workflow secrets, or Appwrite resources. Any future backend change may trigger redeployment because the Appwrite Function is connected to this GitHub branch. Production migration requires a separately reviewed change and backup/rollback plan.
