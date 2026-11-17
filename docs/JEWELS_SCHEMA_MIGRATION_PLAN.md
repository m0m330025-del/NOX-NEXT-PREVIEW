# NOX NEXT — Jewels Schema Migration Plan

**Status:** Planning only; no database or backend changes have been applied.
**Branch:** `feature/moderation-functions-scaffold`
**Prerequisites:** Review of the existing TablesDB bootstrap, moderation store, transaction integration test, and wallet requirements.

## 1. Current repository facts

- The current `scripts/setup-appwrite.mjs` creates private TablesDB tables with empty table permissions and `rowSecurity: true`.
- Its column factory currently supports only `varchar`, `datetime`, and `boolean`; an integer column type is not currently implemented.
- It creates unique and regular indexes using `TablesDB.createIndex`.
- The repository currently contains no wallet, wallet-ledger, gift-catalog, or gift-event table definitions in this bootstrap.
- The existing Appwrite transaction integration test updates a row in `friend_requests`; it does not yet prove multi-table atomicity, unique-index behavior, or concurrent jewel spending.
- The wallet requirements specify one central NXC wallet per account. Jewels conversion must credit that existing wallet and must not create a separate NXC balance.

## 2. Proposed jewels tables

All tables remain private, with empty table permissions and row-level security enabled. All writes are server-side only.

### `jewel_accounts`

| Column | Proposed type | Required | Notes |
|---|---|---:|---|
| `userId` | varchar(36) | yes | Authenticated Appwrite user ID; unique |
| `availableJewels` | integer | yes | Current spendable jewel count, including an odd remainder |
| `lifetimeEarnedJewels` | integer | yes | Projection from immutable award events |
| `lifetimeConvertedJewels` | integer | yes | Projection from immutable conversion events |
| `updatedAt` | datetime | yes | Server timestamp |

Indexes: unique `userId`.

### `jewel_events`

Append-only award history; one award event per successfully completed qualifying gift.

| Column | Proposed type | Required | Notes |
|---|---|---:|---|
| `userId` | varchar(36) | yes | Recipient user ID |
| `sourceGiftId` | varchar(36) | yes | Unique completed gift reference |
| `giftCatalogVersion` | varchar(64) | yes | Catalog version snapshot |
| `giftValueNxc` | integer | yes | Server-snapshotted gift value |
| `jewelsAwarded` | integer | yes | Server-calculated; 1 NXC = 1 jewel |
| `rewardPolicyVersion` | varchar(64) | yes | Applied policy version |
| `createdAt` | datetime | yes | Server timestamp |

Indexes: unique `sourceGiftId`; lookup `userId, createdAt`.

### `jewel_conversions`

Append-only conversion receipts.

| Column | Proposed type | Required | Notes |
|---|---|---:|---|
| `userId` | varchar(36) | yes | Authenticated user ID |
| `idempotencyKey` | varchar(64) | yes | Unique per user/request |
| `jewelsDebited` | integer | yes | Positive, even integer |
| `nxcCredited` | integer | yes | Exactly jewelsDebited / 2 |
| `walletLedgerRef` | varchar(64) | yes | Reference to central wallet ledger entry |
| `createdAt` | datetime | yes | Server timestamp |

Indexes: unique `userId, idempotencyKey`; lookup `userId, createdAt`.

## 3. Required accounting invariants

1. Award formula: 1 NXC of authoritative completed-gift catalog value = 1 jewel.
2. Conversion formula: 2 jewels = 1 NXC.
3. Odd jewel remainder stays in `availableJewels`; no rounding or loss.
4. Conversion never changes historical gift progression.
5. The jewel account projection and its immutable event must be written in the same transaction.
6. A conversion must debit jewels, credit the one central NXC wallet, and write both conversion receipt and wallet-ledger record in one atomic transaction.
7. No client-provided user ID, balance, gift price, jewel award, or NXC credit is trusted.
8. Replays return the original receipt; they never create a second award or credit.
9. Completed gifts have no ordinary cancellation path.
10. No member cash balance, cash marketplace, payout, escrow, or external-payment workflow is part of this schema.

## 4. Migration blockers — do not create tables yet

### A. Central wallet schema is not present in the current bootstrap

Before implementing `jewel_conversions`, identify and approve the canonical NXC wallet and append-only ledger tables. The jewels feature must reference those exact records rather than inventing a second wallet model. This plan intentionally does not guess their table IDs or columns.

### B. Integer column support is missing from the bootstrap

The setup script's column factory must be extended and tested for Appwrite integer columns before these tables can be provisioned. Do not silently store monetary-like integer counters as floating-point values or unvalidated strings.

### C. Concurrency guarantee needs a dedicated integration test

The existing transaction test is single-row/single-table only. Add an isolated multi-table test that:
- stages a jewel-account debit, central-wallet credit, conversion receipt, and ledger row;
- proves all four become visible together after commit;
- proves none become visible after rollback;
- races two conversions against the same available balance and proves the balance cannot be overspent;
- retries the same idempotency key after a simulated lost response and proves there is only one credit;
- verifies duplicate source gift IDs and duplicate user/idempotency pairs are rejected by unique indexes.

### D. Runtime compatibility remains unresolved

The root package allows Node 22–26, while `functions/moderation/package.json` currently declares Node `>=22 <23`. Resolve this mismatch with an explicit tested runtime decision before any backend deployment. Do not change the deployed Appwrite Function runtime as an incidental migration step.

## 5. Safe implementation order

1. Approve and document the canonical central wallet and ledger schema.
2. Confirm the exact Appwrite integer-column SDK method and live service support.
3. Add test-only migration definitions and verify private permissions, row security, columns, and indexes in a non-production database.
4. Extend the transaction integration suite to cover the multi-table and concurrency cases above.
5. Resolve Node runtime/package alignment and run the full test suite.
6. Only after all gates pass, review a separate migration PR. Do not enable production conversion until the integration tests pass.

## 6. Deployment boundary

This file is documentation only. No Appwrite tables, columns, indexes, function code, secrets, or runtime settings were changed. Backend commits may trigger a redeploy because the Appwrite Function is connected to this GitHub branch.

**Decision:** Schema creation is blocked until the canonical wallet/ledger schema and the multi-table transaction proof are available.
