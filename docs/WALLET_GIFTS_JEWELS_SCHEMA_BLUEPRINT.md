# NOX NEXT — Proposed Wallet, Gift & Jewels Schema Blueprint

**Status:** Finalized design proposal for review; not a migration and not deployed.
**Branch:** `feature/moderation-functions-scaffold`
**Database target:** Existing `NOX_CORE` only after separate approval.
**Prerequisites:** Ledger invariants, numeric compatibility, and integration-test specifications.

## 1. Design decisions

- Keep one canonical NXC wallet per account.
- Keep NXC and JEWEL journals separate. Never mix amounts from different units in one balance equation.
- Treat wallet/account rows as projections; immutable journal/event rows are the audit source of truth.
- Every related write must commit in one verified TablesDB transaction.
- Use private tables, empty table permissions, row security enabled, and server-only writes.
- No client balance mutation, cash balance, cash-out, NXC-to-cash, member cash market, escrow, or payout functionality.
- No literal infinite owner balance.
- Completed gifts are final; no ordinary cancellation endpoint.

## 2. Proposed table inventory

| Table ID | Purpose | Mutable? |
|---|---|---|
| `nxc_wallets` | One spendable NXC balance projection per user | Yes, server only |
| `nxc_transactions` | Parent transaction envelope / idempotency | Status only while pending; committed record immutable |
| `nxc_ledger_entries` | Immutable NXC journal | Append-only |
| `jewel_accounts` | Available and lifetime jewel projections | Yes, server only |
| `jewel_ledger_entries` | Immutable JEWEL journal | Append-only |
| `gift_catalog` | Authoritative gift names, price, active/version data | Versioned; no rewriting historical snapshots |
| `gift_events` | Completed gift event and catalog-price snapshot | Append-only |
| `jewel_events` | One jewel award linked to a qualifying gift | Append-only |
| `jewel_conversions` | Conversion receipt linking both journals | Append-only |

The account progression projection should be a separate entitlement view/table or be rebuilt from `gift_events`; it must not be conflated with wallet balance or available jewels. The exact projection table can be selected during the membership feature implementation.

## 3. Column blueprint

All IDs below are server-generated row IDs or immutable reference strings. All tables use `permissions: []` and `rowSecurity: true`.

### 3.1 `nxc_wallets`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `userId` | varchar(36) | yes | unique; verified account ID |
| `balanceNxc` | bigint | yes | non-negative; application safe-range check |
| `status` | varchar(16) | yes | active / restricted / frozen |
| `createdAt` | datetime | yes | server timestamp |
| `updatedAt` | datetime | yes | server timestamp |

Indexes: unique `userId`; key `status, updatedAt`.

### 3.2 `nxc_transactions`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `transactionRef` | varchar(64) | yes | unique |
| `type` | varchar(32) | yes | topup / transfer / gift / jewels_conversion / correction |
| `status` | varchar(16) | yes | pending / committed / failed / reversed |
| `sourceRef` | varchar(96) | yes | provider event or internal source |
| `idempotencyScope` | varchar(64) | yes | authenticated user or trusted provider namespace |
| `idempotencyKey` | varchar(96) | yes | request identity |
| `payloadHash` | varchar(64) | yes | binds key to canonical request |
| `createdAt` | datetime | yes | server timestamp |
| `committedAt` | datetime | no | set only after confirmed commit |

Indexes: unique `transactionRef`; unique `type, idempotencyScope, idempotencyKey`; key `sourceRef`; key `status, createdAt`.

A replay with the same key and same payload returns the original result. Same key with a different payload is a conflict.

### 3.3 `nxc_ledger_entries`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `entryRef` | varchar(64) | yes | unique |
| `transactionRef` | varchar(64) | yes | parent NXC transaction |
| `accountType` | varchar(24) | yes | user_wallet / platform_clearing / issuance |
| `accountId` | varchar(64) | yes | server-controlled account key |
| `direction` | varchar(8) | yes | debit / credit |
| `amountNxc` | bigint | yes | positive integer |
| `reasonCode` | varchar(40) | yes | topup / transfer / gift / jewels_conversion / correction |
| `sourceRef` | varchar(96) | yes | immutable source event |
| `createdAt` | datetime | yes | server timestamp |

Indexes: unique `entryRef`; key `transactionRef`; key `accountType, accountId, createdAt`; key `sourceRef`.

Do not depend on a composite unique index containing nullable or optional fields. Idempotency is enforced by the unique transaction envelope plus source-specific unique references and transaction conflict handling.

### 3.4 `jewel_accounts`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `userId` | varchar(36) | yes | unique; derived from authenticated account |
| `availableJewels` | bigint | yes | non-negative; odd remainder retained |
| `lifetimeEarnedJewels` | bigint | yes | non-negative projection |
| `lifetimeConvertedJewels` | bigint | yes | non-negative projection |
| `updatedAt` | datetime | yes | server timestamp |

Indexes: unique `userId`; key `updatedAt`.

### 3.5 `jewel_ledger_entries`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `entryRef` | varchar(64) | yes | unique |
| `parentTransactionRef` | varchar(64) | yes | links cross-unit operation |
| `accountType` | varchar(24) | yes | user_jewels / reward_issuance / conversion_clearing |
| `accountId` | varchar(64) | yes | server-controlled account key |
| `direction` | varchar(8) | yes | debit / credit |
| `amountJewels` | bigint | yes | positive integer |
| `reasonCode` | varchar(40) | yes | gift_reward / jewels_conversion / correction |
| `sourceRef` | varchar(96) | yes | gift or conversion ID |
| `createdAt` | datetime | yes | server timestamp |

Indexes: unique `entryRef`; key `parentTransactionRef`; key `accountType, accountId, createdAt`; key `sourceRef`.

### 3.6 `gift_catalog`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `giftKey` | varchar(48) | yes | stable catalog key |
| `version` | varchar(24) | yes | immutable version |
| `displayName` | varchar(80) | yes | localized display key/name |
| `priceNxc` | bigint | yes | positive integer |
| `assetKey` | varchar(128) | yes | controlled asset reference |
| `isActive` | boolean | yes | new sends only |
| `createdAt` | datetime | yes | server timestamp |

Indexes: unique `giftKey, version`; key `isActive`.

Price/name/assets changes create a new version. Do not edit the price snapshot for previously completed gifts. Catalog still targets 50 gifts; the rose remains 100 NXC.

### 3.7 `gift_events`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `giftEventRef` | varchar(64) | yes | unique |
| `transactionRef` | varchar(64) | yes | NXC transaction |
| `senderUserId` | varchar(36) | yes | verified sender |
| `recipientUserId` | varchar(36) | yes | verified recipient |
| `giftKey` | varchar(48) | yes | catalog key |
| `giftCatalogVersion` | varchar(24) | yes | immutable version snapshot |
| `giftValueNxc` | bigint | yes | catalog price snapshot |
| `sourceModule` | varchar(24) | yes | chat / game / status / reels |
| `createdAt` | datetime | yes | server timestamp |

Indexes: unique `giftEventRef`; key `transactionRef`; key `senderUserId, createdAt`; key `recipientUserId, createdAt`.

Completed gifts are final. Do not add `cancelled` as an ordinary post-completion state.

### 3.8 `jewel_events`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `eventRef` | varchar(64) | yes | unique |
| `sourceGiftEventRef` | varchar(64) | yes | unique; one award per completed gift |
| `userId` | varchar(36) | yes | eligible female recipient |
| `giftValueNxc` | bigint | yes | copied from completed gift snapshot |
| `jewelsAwarded` | bigint | yes | equals giftValueNxc under policy |
| `rewardPolicyVersion` | varchar(24) | yes | approved policy version |
| `createdAt` | datetime | yes | server timestamp |

Indexes: unique `eventRef`; unique `sourceGiftEventRef`; key `userId, createdAt`.

Award only after successful gift commit, in the same atomic transaction. The current rule is 1 NXC of qualifying gift value = 1 jewel.

### 3.9 `jewel_conversions`

| Column | Type | Required | Constraints |
|---|---|---:|---|
| `conversionRef` | varchar(64) | yes | unique |
| `parentTransactionRef` | varchar(64) | yes | matching NXC transaction |
| `userId` | varchar(36) | yes | authenticated account |
| `idempotencyKey` | varchar(96) | yes | request identity |
| `jewelsDebited` | bigint | yes | positive, even integer |
| `nxcCredited` | bigint | yes | exactly jewelsDebited / 2 |
| `nxcLedgerTransactionRef` | varchar(64) | yes | linked NXC posting |
| `createdAt` | datetime | yes | server timestamp |

Indexes: unique `conversionRef`; unique `parentTransactionRef`; key `userId, createdAt`.

Conversion must also be idempotent at the parent transaction layer. The conversion receipt, jewel debit, NXC credit, both journals, and both balance projections commit atomically.

## 4. Numeric type and SDK requirements

The repository bootstrap currently supports only varchar, datetime, and boolean column types. It does not yet support integer or bigint. The design above proposes bigint for balances, lifetime totals, and ledger amounts to avoid the 32-bit integer ceiling.

Before using bigint:
- verify the pinned `node-appwrite@31.3.0` exposes the correct create-bigint-column method;
- verify serialization and round-trip behavior with the exact supported application-safe range;
- do not assume JavaScript Number safely represents every signed 64-bit integer;
- use explicit safe bounds or a lossless integer representation supported end-to-end;
- validate all amounts server-side.

No schema code should be written until this test passes.

## 5. Appwrite index and transaction caveats

- The bootstrap script currently skips any existing column by key without verifying its persisted type, size, or required flag. A future migration must inspect and fail on mismatches rather than silently accept them.
- Existing index creation supports key and unique index definitions, but the proposed multi-column unique indexes and their limits must be validated against the live TablesDB service.
- A unique index alone does not prevent lost updates. Concurrency must be proven with real transaction tests.
- Do not put all idempotency guarantees on a single nullable composite unique index.
- All journal/event tables remain private and server-write-only.

## 6. Transaction posting requirements

### Transfer
One NXC transaction envelope, sender wallet debit, recipient wallet credit, and two balanced NXC journal entries.

### Gift
One NXC transaction envelope, sender wallet debit, approved platform-side offset, immutable gift event, and (for eligible female recipients) one JEWEL award plus its JEWEL journal posting.

### Jewels conversion
One parent transaction, jewel account debit, NXC wallet credit, jewel conversion receipt, one balanced JEWEL journal posting, and one balanced NXC journal posting.

### Top-up
Only a trusted provider server-to-server confirmation may create the wallet credit. Provider reference uniqueness and reconciliation are mandatory. Client redirects are not payment proof.

All operations are disabled until the transaction and concurrency tests pass.

## 7. Migration rollout plan (not executed)

1. Create a dedicated non-production Appwrite project/database.
2. Add and verify bigint SDK support and strict schema reconciliation.
3. Create the proposed private tables and indexes in the test database only.
4. Run multi-table commit/rollback, conflict, idempotency, and concurrent debit tests.
5. Verify ledger rebuild equals all balance projections.
6. Resolve Node engine mismatch and test the exact deployment runtime.
7. Obtain review/approval of platform issuance and reward clearing account policy.
8. Prepare a separately reviewed production migration with backup, preflight checks, rollback plan, and no automatic balance seeding.
9. Only after migration approval, implement server APIs and expose read-only UI integration first.

## 8. Explicitly unresolved decisions

- Final system issuance/clearing account policy for NXC and JEWEL.
- Whether the NXC top-up accounting offset is an issuance account or another approved controlled account.
- Exact numeric safe bounds after SDK serialization tests.
- Whether progression projection is stored or rebuilt on demand.
- Admin approval and audit policy for exceptional accounting adjustments.

These unresolved items block production activation. No assumptions or invented revenue splits are encoded.

## 9. Change boundary

This document only specifies a proposed schema. It does not alter `scripts/setup-appwrite.mjs`, backend code, GitHub Actions, Appwrite tables, secrets, or runtime. Any future backend commit may trigger redeployment of the connected Appwrite Function.
