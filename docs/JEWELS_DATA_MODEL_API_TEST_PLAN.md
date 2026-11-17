# NOX NEXT — Jewels Data Model, API Contract & Test Plan

**Status:** Design proposal only — not implemented.
**Branch:** `feature/moderation-functions-scaffold`
**Scope:** Internal jewels accounting, gift-based progression, and jewels-to-NXC conversion.
**Safety boundary:** This design covers in-app records only. It does not implement cash balances, member cash trading, cash listings, escrow, payouts, or external payment coordination.

## 1. Confirmed product rules

1. A successfully recorded gift is final and cannot be cancelled through the product.
2. Female accounts receive jewels from qualifying gifts successfully received.
3. Conversion rate: **2 jewels = 1 NXC**.
4. A single remaining jewel stays available until another jewel is earned; it is never rounded up or discarded.
5. Conversion does not reduce the historical gift-progression total.
6. Converted NXC is credited to the account's one central NXC wallet.
7. The jewels page calculator is a preview only. Only a successful server response and ledger record represent a conversion.
8. No cash marketplace, cash-out, or member-to-member cash settlement is part of this feature.

## 2. Product rule still required before activation

**Approved formula:** each **1 NXC** of the successfully received gift's authoritative catalog value awards **1 jewel** to an eligible female recipient. For example, a qualifying gift valued at 100 NXC awards 100 jewels.

The server must calculate the award from the gift catalog value snapshotted at successful gift recording. Store the applied reward-policy version with the event. Never accept a client-supplied jewels amount or reward multiplier.

## 3. Data model proposal

Use immutable event/ledger records as the source of truth. Cached account totals are projections and must be rebuildable.

### 3.1 `jewel_accounts`

One row per eligible account.

| Field | Type | Rule |
|---|---|---|
| `userId` | string | Unique; derived from authenticated identity |
| `availableJewels` | integer | Non-negative; includes an odd remainder |
| `lifetimeEarnedJewels` | integer | Non-negative projection from earn events |
| `lifetimeConvertedJewels` | integer | Non-negative projection from conversion events |
| `updatedAt` | ISO timestamp | Server generated |

Do not expose direct client writes to this table.

### 3.2 `jewel_events`

Append-only record for every jewel award.

| Field | Type | Rule |
|---|---|---|
| `eventId` | string | Unique server-generated ID |
| `userId` | string | Recipient account |
| `sourceGiftId` | string | Unique link to the completed gift |
| `giftCatalogVersion` | string | Catalog version used |
| `giftValueNxc` | integer | Server snapshot at successful gift recording |
| `jewelsAwarded` | integer | Server-calculated; no client input |
| `rewardPolicyVersion` | string | Approved policy version |
| `createdAt` | ISO timestamp | Server generated |

Enforce uniqueness on `sourceGiftId` for the jewel-award event so retries cannot award twice.

### 3.3 `jewel_conversions`

Immutable conversion receipt.

| Field | Type | Rule |
|---|---|---|
| `conversionId` | string | Unique server-generated ID |
| `userId` | string | Authenticated account |
| `idempotencyKey` | string | Unique per user/request |
| `jewelsDebited` | integer | Positive, even integer |
| `nxcCredited` | integer | Exactly `jewelsDebited / 2` |
| `walletLedgerRef` | string | Reference to the matching NXC ledger transaction |
| `createdAt` | ISO timestamp | Server generated |

Enforce uniqueness for both `conversionId` and the pair `(userId, idempotencyKey)`.

### 3.4 Existing progression history

Keep gift progression separate from jewel availability and the spendable NXC wallet.

A completed qualifying gift contributes its catalog NXC value once to the recipient's historical received-gift progression. Conversion must never update or delete that progression event.

## 4. API contract proposal

All endpoints require a valid authenticated session. The server derives `userId` from the verified Appwrite identity; it must ignore any client-supplied user ID, balance, reward amount, gift price, or wallet balance.

### Read current jewels summary

`GET /v1/me/jewels`

Response fields:
- `availableJewels`
- `convertibleJewels` (largest even portion of available jewels)
- `remainderJewels` (0 or 1)
- `previewNxc` (convertible jewels divided by 2)
- `conversionRate` (`2:1`)
- `lifetimeEarnedJewels`
- `lifetimeConvertedJewels`

This endpoint is read-only.

### Convert jewels

`POST /v1/me/jewels/conversions`

Request:
```json
{
  "jewelsAmount": 20,
  "idempotencyKey": "client-generated-unique-request-key"
}
```

Server validations:
- Authenticated account is eligible for the jewels feature.
- Amount is a positive integer and even.
- Amount does not exceed the current available jewels.
- Idempotency key is present, scoped to the authenticated user, and has not been used for a different request.
- Conversion policy is active.
- The central wallet can receive the matching NXC ledger credit.

Successful response:
```json
{
  "conversionId": "server-generated-id",
  "jewelsDebited": 20,
  "nxcCredited": 10,
  "availableJewels": 3,
  "walletLedgerRef": "server-ledger-reference"
}
```

The example values are illustrative only, not live balances.

### Gift completion integration

When the server successfully records a gift:
1. Validate and snapshot the authoritative catalog value.
2. Persist the completed gift event once.
3. Update the applicable gift-progression projection once.
4. For an eligible female recipient, calculate jewels only through the approved, versioned reward policy.
5. Persist the jewel award linked to the gift.
6. Ensure retries cannot duplicate the gift, progression contribution, or jewel award.

The completed gift must not have a normal cancellation endpoint.

## 5. Atomicity and failure behavior

A conversion must debit jewels and credit NXC as one atomic operation, with a single durable outcome. Do not implement a sequence of independent writes that can leave one side committed without the other.

Before implementation, verify the exact transaction guarantees supported by the selected Appwrite TablesDB/API version. If the required multi-record atomic transaction is unavailable, keep conversion disabled until a supported atomic design is selected. Do not simulate success in the client.

Never edit or delete completed ledger events. Corrections, if ever required for a genuine data-integrity incident, must be separate, permissioned, reason-required, linked, and audited.

## 6. Security and authorization

- All award and conversion calculations run server-side.
- User identity comes only from the verified session.
- Users can read only their own jewels summary and conversion receipts.
- Users cannot write jewel accounts, award events, progression events, or wallet ledger rows.
- Admins cannot directly edit balances. Exceptional corrections require a restricted audited workflow.
- Apply request size validation, rate limits, replay protection, and idempotency.
- Do not log secrets, session tokens, or unnecessary personal data.
- No endpoint accepts cash amounts, bank/mobile-wallet details, buyer/seller IDs, or off-platform payment proof.

## 7. Required automated tests

### Awarding and progression
1. One successfully recorded qualifying gift creates one progression contribution.
2. A retry of the same gift does not duplicate progression or jewels.
3. A failed gift creates no progression and no jewels.
4. The gift's catalog value is snapshotted from the server, not accepted from the client.
5. The approved 1 NXC = 1 jewel policy is applied server-side; a client cannot override its version or amount.
6. A completed gift has no normal cancellation operation.

### Conversion
1. 2 jewels convert to exactly 1 NXC.
2. 20 jewels convert to exactly 10 NXC.
3. An odd remainder remains available after conversion.
4. A one-jewel conversion request is rejected.
5. Zero, negative, fractional, malformed, and over-balance amounts are rejected.
6. Repeating the same idempotency key returns the original receipt and does not credit NXC twice.
7. Reusing the same key with a different amount is rejected.
8. Two concurrent conversions cannot spend the same jewels.
9. If any part of the atomic operation fails, neither the jewel debit nor NXC credit is committed.
10. The matching wallet ledger entry and conversion receipt reference each other.
11. Conversion leaves historical gift progression unchanged.
12. Another user's account cannot be read or modified by changing request parameters.

### Operations and recovery
1. Rebuilding projections from immutable events reproduces the same balances.
2. Duplicate gift events and duplicate conversion events are detected.
3. Audit records identify the actor, reason, timestamp, and linked references for any exceptional correction.
4. Feature remains unavailable if transaction guarantees or required indexes/uniqueness constraints are missing.

## 8. Appwrite implementation gate

This document does not create tables, indexes, functions, or environment variables. Before backend implementation:
- confirm the current TablesDB schema and exact unique-index support;
- confirm transaction support and rollback behavior for the deployed Appwrite version;
- review the current Node runtime/package compatibility;
- add automated tests before exposing any conversion route;
- deploy first to a non-production test environment and verify failure/retry/concurrency behavior.

The current Appwrite Function is connected to the GitHub branch. Any backend commit may trigger a redeploy. Do not change its runtime as part of this design-only step.

## 9. Approval status

The product owner approved the award formula: **1 NXC of qualifying gift value = 1 jewel**. The formula is now specified for implementation review. Production activation still requires backend implementation, atomicity verification, automated tests, and deployment checks.
