# NOX NEXT — TablesDB Numeric Columns & Transaction Compatibility

**Status:** Documentation review only; no live Appwrite calls or schema changes performed.
**SDK pinned in repository:** `node-appwrite@31.3.0`
**Target database:** `NOX_CORE`

## 1. Official Appwrite documentation findings

The current Appwrite TablesDB documentation lists:
- `integer`: signed 32-bit, -2,147,483,648 to 2,147,483,647.
- `bigint`: signed 64-bit, -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807.
- `float`: available, but must not be used for wallet or jewel amounts.

Reference: https://appwrite.io/docs/products/databases/tablesdb/tables

The current server Node.js TablesDB API reference lists both create-integer-column and create-bigint-column endpoints:
https://appwrite.io/docs/references/cloud/server-nodejs/tablesDB

**Implication:** NXC and jewel balances must remain integer-valued. The schema should use a sufficiently wide integer representation for lifetime totals and future growth. The exact choice must also account for JavaScript number precision and the SDK's serialization behavior; do not assume every signed 64-bit value can safely pass through a JavaScript Number. Validate supported bounds and serialization in tests.

## 2. Current repository bootstrap gap

The current `scripts/setup-appwrite.mjs` column factory maps only:
- varchar -> createVarcharColumn
- datetime -> createDatetimeColumn
- boolean -> createBooleanColumn

It does not currently map integer or bigint columns. Therefore, the existing bootstrap cannot create the proposed numeric wallet/jewel columns without a reviewed code change.

No bootstrap change is made by this document.

## 3. Transaction documentation findings

Official TablesDB transaction documentation states:
- A transaction can stage operations across multiple databases and tables.
- Supported row operations accept a transaction ID.
- Staged changes are applied together on commit.
- The service detects conflicts when affected rows change outside the transaction.
- Transactions should be kept short-lived.

Reference: https://appwrite.io/docs/products/databases/tablesdb/transactions

This is documented service behavior, not proof of correct behavior in this NOX project, pinned SDK, or target deployment. The dedicated isolated integration tests remain mandatory.

## 4. Proposed numeric storage policy

| Data | Proposed representation | Notes |
|---|---|---|
| Spendable NXC wallet balance | integer-valued column | Must reject negative balance |
| NXC ledger amount | integer-valued column | Positive amount plus explicit direction |
| Available jewels | integer-valued column | Preserve odd remainder |
| Lifetime earned jewels | wide integer | Monotonic progression total |
| Lifetime converted jewels | wide integer | Audit counter, not progression balance |
| Gift catalog price snapshot | integer-valued column | Immutable snapshot at gift completion |

The final column type and maximum accepted value must be selected after checking SDK serialization, Appwrite column constraints, and application-level safe bounds. Floating-point values are prohibited for all of these fields.

## 5. Required SDK verification before schema work

In a disposable test project using the exact pinned `node-appwrite@31.3.0`:
1. Verify the SDK exposes the expected integer and bigint column creation methods.
2. Create disposable integer and bigint columns and read their metadata back.
3. Write/read boundary values within the chosen application-safe range.
4. Verify invalid, fractional, negative, and out-of-range values are rejected where applicable.
5. Verify serialization round-trips without precision loss.
6. Delete only the disposable test table/columns after confirming cleanup targets.

Do not infer SDK method names solely from REST endpoint names.

## 6. Required transaction verification

Use isolated disposable rows to prove:
- one transaction can stage updates/creates across wallet, ledger, jewel account, and conversion receipt tables;
- ordinary reads do not expose staged writes before commit;
- commit exposes the complete set;
- rollback exposes none of the staged changes;
- a concurrent update causes a conflict rather than a lost update;
- retry logic does not duplicate ledger entries or credits.

## 7. Runtime compatibility remains open

Repository state previously inspected:
- root package permits Node 22 through 26;
- `functions/moderation/package.json` declares Node >=22 <23;
- Appwrite Function was previously configured as Node 26;
- current integration workflow runs Node 22.

Do not change the runtime or package engine range as part of this documentation-only review. Resolve the mismatch through a separate compatibility check and explicit deployment decision.

## 8. Go/no-go

No wallet or jewels schema migration should proceed until:
- SDK integer/bigint methods and safe serialization are verified;
- multi-table commit/rollback and concurrency tests pass in an isolated Appwrite environment;
- the runtime mismatch is resolved;
- canonical ledger balancing and idempotency tests pass.

This file does not create tables, modify balances, alter secrets, or trigger a backend deployment.
