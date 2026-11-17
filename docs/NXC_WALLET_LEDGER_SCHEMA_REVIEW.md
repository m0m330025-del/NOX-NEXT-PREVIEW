# NOX NEXT — Central NXC Wallet & Ledger Schema Review

**Status:** Proposed schema only; not implemented or deployed.
**Branch:** `feature/moderation-functions-scaffold`
**Purpose:** Define the canonical internal NXC wallet records that jewels conversion must use.

## 1. Repository review findings

The current repository contains wallet product requirements, but the existing Appwrite bootstrap does not define a wallet table, wallet ledger table, gift catalog table, or completed gift-event table. The moderation store also has no wallet persistence implementation.

Therefore, there is currently no canonical wallet row or ledger reference that the jewels conversion API can safely credit. Do not create a second wallet inside the jewels feature.

The existing bootstrap column factory supports `varchar`, `datetime`, and `boolean`; integer support must be added and verified before balances or ledger amounts can be stored safely.

## 2. Proposed canonical tables

All tables must be private (`permissions: []`, `rowSecurity: true`). Client-side direct writes are forbidden. All balance mutations must run through authenticated server-side functions.

### 2.1 `nxc_wallets` — one row per account

| Column | Type | Required | Purpose |
|---|---|---:|---|
| `userId` | varchar(36) | yes | Authenticated account ID; unique |
| `balanceNxc` | integer | yes | Current spendable NXC balance |
| `status` | varchar(16) | yes | active / restricted / frozen |
| `createdAt` | datetime | yes | Server timestamp |
| `updatedAt` | datetime | yes | Server timestamp |

Indexes: unique `userId`; key `status, updatedAt`.

This is the operational balance projection. It is not the audit source of truth and must be reconciled against the ledger.

### 2.2 `nxc_ledger_entries` — append-only journal

| Column | Type | Required | Purpose |
|---|---|---:|---|
| `entryRef` | varchar(64) | yes | Unique immutable entry reference |
| `transactionRef` | varchar(64) | yes | Groups entries in one logical transaction |
| `accountType` | varchar(24) | yes | user_wallet / platform_clearing / reward_liability |
| `accountId` | varchar(64) | yes | User ID or controlled system account key |
| `direction` | varchar(8) | yes | debit / credit |
| `amountNxc` | integer | yes | Positive integer amount |
| `reasonCode` | varchar(40) | yes | topup / transfer / gift / jewels_conversion / correction |
| `sourceRef` | varchar(64) | yes | Payment, transfer, gift, or conversion source |
| `idempotencyKey` | varchar(64) | yes | Server-enforced replay protection |
| `createdAt` | datetime | yes | Server timestamp |

Indexes: unique `entryRef`; key `transactionRef`; key `accountType, accountId, createdAt`; unique `accountType, accountId, idempotencyKey`.

Rules:
- Ledger rows are never edited or deleted after commit.
- Corrections use new reversing/adjusting entries linked to the original reference.
- Each logical transaction must balance: total debits equal total credits across the controlled ledger accounts.
- Amounts are positive integers; direction determines sign.
- No client can submit an arbitrary account type, account ID, reason, or amount without server-side authorization and policy validation.

### 2.3 `nxc_transactions` — transaction envelope

| Column | Type | Required | Purpose |
|---|---|---:|---|
| `transactionRef` | varchar(64) | yes | Unique logical transaction |
| `type` | varchar(32) | yes | topup / transfer / gift / jewels_conversion / correction |
| `status` | varchar(16) | yes | pending / committed / failed / reversed |
| `sourceRef` | varchar(64) | yes | Provider or internal source reference |
| `idempotencyKey` | varchar(64) | yes | Unique request identity |
| `createdAt` | datetime | yes | Server timestamp |
| `committedAt` | datetime | no | Server commit timestamp |

Indexes: unique `transactionRef`; unique `type, idempotencyKey`; key `sourceRef`; key `status, createdAt`.

The transaction envelope, affected wallet row(s), ledger entries, and feature-specific event/receipt must be committed together in one verified Appwrite transaction. Never report success before commit is confirmed.

## 3. How jewels conversion uses this canonical wallet

A conversion of 20 jewels must produce:
1. One jewel-account debit of 20.
2. One immutable jewel-conversion receipt recording 20 jewels debited and 10 NXC credited.
3. One credit of 10 NXC to the user's existing `nxc_wallets.balanceNxc`.
4. Balanced ledger entries under one transaction reference.
5. One transaction envelope marked committed.

All five effects must commit atomically. The 1:1 jewel-award rule and 2:1 conversion rule remain unchanged. Conversion must not alter historical received-gift progression.

## 4. Other flows that must reuse the same wallet

- Internal NXC transfer: debit sender and credit recipient atomically, with paired ledger entries.
- Gift send: debit sender and create the completed gift event atomically. The gift event stores the catalog-price snapshot used for progression and jewels.
- Approved NXC top-up: credit only after a trusted provider server-to-server confirmation; unique provider event/reference prevents duplicate credit.
- Games and other paid features: debit the same wallet through a server-authorized transaction.
- Any correction: separate permissioned, reasoned, audited reversal/adjustment; never rewrite old ledger entries.

The owner-funded issuance and provider settlement design needs a separately reviewed accounting specification before implementation. No literal unlimited balance should be stored.

## 5. Explicit exclusions

This schema does not provide user cash balances, cash-out, NXC-to-cash conversion, member cash marketplace, cash listings, buyer/seller matching, escrow, payout, or external payment coordination. NXC is an in-app unit only.

## 6. Implementation gates

1. Confirm the exact integer column type and SDK method supported by the pinned `node-appwrite@31.3.0` and live Appwrite Cloud service.
2. Confirm Appwrite transaction behavior for creating rows and updating multiple rows/tables, including conflicts and rollback.
3. Add a non-production integration test for a balanced two-sided ledger transaction and rollback.
4. Add concurrency tests for two simultaneous debits against one wallet balance; prove no negative balance or overspend is possible.
5. Add idempotency tests for duplicate requests and duplicate provider events.
6. Define and test the canonical system/clearing account model and reconciliation procedure.
7. Resolve the Node engine mismatch: root permits Node 22–26, nested function package currently declares Node >=22 <23, while the deployed function was previously identified as Node 26.
8. Only then prepare a separate migration and backend implementation change for review.

## 7. Deployment boundary

This document is a design review only. It changes no Appwrite database resources, function code, secrets, or runtime settings. Backend commits may trigger a redeploy because the Appwrite Function is connected to this GitHub branch.

**Decision:** Jewels conversion remains blocked until this canonical wallet/ledger schema is approved and the multi-table transaction and concurrency tests pass.
