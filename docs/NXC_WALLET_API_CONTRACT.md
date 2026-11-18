# NOX NXC Wallet — Read API Contract & Transfer Boundary

**Status:** API contract proposal only; not implemented or deployed.  
**Branch:** `feature/moderation-functions-scaffold`  
**Related:** `WALLET_GIFTS_JEWELS_SCHEMA_BLUEPRINT.md`, `WALLET_JEWELS_INTEGRATION_TEST_SPEC.md`, `WALLET_POST_APPROVAL_ENGINEERING_READINESS.md`

## 1. Contract principles

- The authenticated Appwrite session is the only source of the caller identity.
- The client never sends an authoritative balance, sender ID, ledger account, transfer status, fee, gift price, or reward amount.
- All amounts are positive integer NXC values; no floating point.
- All wallet writes are server-only and use a single verified transaction boundary.
- Responses expose a read model, not raw database rows or internal ledger account identifiers.
- Errors must not reveal whether another person's wallet exists or expose private account data.
- No cash balance, member cash-out, cash marketplace, escrow, or payout API exists.

## 2. Proposed read endpoints

### GET /v1/me/wallet

Returns the caller's wallet projection.

**200 response**
```json
{
  "wallet": {
    "unit": "NXC",
    "availableBalance": 0,
    "status": "active",
    "updatedAt": "ISO-8601"
  }
}
```

Rules:
- Resolve the account from the validated session.
- If a wallet has not yet been provisioned, return a controlled `wallet_not_ready` response; do not silently mint or seed a balance.
- Do not expose platform or clearing account balances.

### GET /v1/me/wallet/transactions?cursor=...&limit=...

Returns only transactions involving the caller's wallet, newest first.

**200 response**
```json
{
  "transactions": [
    {
      "transactionRef": "opaque-reference",
      "type": "transfer",
      "direction": "debit",
      "amount": 0,
      "unit": "NXC",
      "status": "committed",
      "createdAt": "ISO-8601",
      "display": {
        "counterpartyNoxId": "NOX-ID",
        "counterpartyDisplayName": "Display name"
      }
    }
  ],
  "nextCursor": null
}
```

Rules:
- Server determines direction and counterparty from committed ledger rows.
- Never include another user's private profile fields.
- Only committed entries appear as completed wallet activity; pending states, if ever surfaced, must be explicitly labeled.
- Enforce bounded page size and stable cursor pagination.

### GET /v1/me/wallet/transactions/{transactionRef}

Returns a transaction receipt only if the caller is a participant. Otherwise return a generic unavailable response.

## 3. Proposed transfer endpoint

### POST /v1/me/wallet/transfers

**Request**
```json
{
  "recipientNoxId": "NOX-ID",
  "amountNxc": 100,
  "idempotencyKey": "client-generated-unique-key"
}
```

The caller identity is not accepted in the request. The server resolves the NOX ID, validates the recipient, and displays the resolved recipient name in a pre-confirmation lookup response before the client submits the transfer.

**Successful response**
```json
{
  "transaction": {
    "transactionRef": "opaque-reference",
    "status": "committed",
    "amountNxc": 100,
    "unit": "NXC",
    "createdAt": "ISO-8601"
  },
  "wallet": {
    "availableBalance": 0
  },
  "replayed": false
}
```

### Transfer processing sequence

1. Authenticate the request and derive sender account ID from the session.
2. Validate NOX ID format and amount as a positive bounded integer.
3. Resolve recipient NOX ID server-side; reject self-transfer and unavailable/restricted accounts.
4. Canonicalize the payload and bind its hash to the idempotency key.
5. If the same key and same payload already committed, return the original receipt. If payload differs, return conflict.
6. Start a short-lived TablesDB transaction.
7. Re-read/validate both wallet rows and stage sender debit, recipient credit, transaction envelope, and two immutable balanced NXC ledger entries.
8. Commit once; on conflict, abort/retry only under a bounded, reviewed retry policy.
9. Return success only after commit confirmation. Never return optimistic success.
10. Emit notifications after commit using an idempotent outbox/event mechanism; notification failure must not reverse a committed transfer.

## 4. Error contract

Use stable machine-readable codes:
- `authentication_required`
- `invalid_amount`
- `recipient_unavailable`
- `cannot_transfer_to_self`
- `insufficient_balance`
- `wallet_restricted`
- `idempotency_conflict`
- `transaction_conflict`
- `wallet_not_ready`
- `service_unavailable`

Do not return raw Appwrite errors, API keys, internal row IDs, or stack traces to clients.

## 5. Admin read-only boundary

Admin wallet screens may query:
- wallet status and balance for a permitted support case;
- transaction references and ledger reconciliation status;
- audit trail and exception review state.

Admin screens must not expose a direct balance edit, mint, delete-ledger, or ordinary gift-cancel control. Any exceptional accounting correction requires a separately designed append-only reversal/adjustment workflow, reason code, actor identity, permission check, and independent approval. This document does not authorize such adjustments.

## 6. Required tests before implementation

- Session identity overrides/rejects any caller-supplied sender ID.
- NOX ID lookup cannot enumerate wallets or disclose unavailable accounts.
- Self-transfer, zero, negative, fractional, excessive, and malformed amounts are rejected.
- Insufficient balance produces no writes.
- Same idempotency key + same payload returns the same receipt.
- Same key + different payload returns conflict.
- Concurrent transfers cannot overspend either wallet.
- Every committed transfer has exactly two balanced NXC entries.
- Failure before commit leaves both balances and ledger unchanged.
- Notification failure after commit does not cause a duplicate transfer on retry.
- A nonparticipant cannot fetch a transaction receipt.
- Admin read endpoints enforce role checks and never mutate balances.

## 7. Appwrite SDK and transaction evidence boundary

Current Appwrite TablesDB documentation describes transaction staging with `transactionId`, multi-table operations, commit/rollback, and conflict detection. It also documents bigint columns. These are platform documentation facts, not a live proof against the NOX project's Appwrite service or the exact pinned SDK package.

The repository pins `node-appwrite@31.3.0` in package manifests, but the inspected branch has no package lockfile at the checked root or function path. The exact SDK method surface and lossless bigint serialization therefore remain unverified. Confirm them in an isolated test project before schema migration.

References:
- https://appwrite.io/docs/products/databases/tablesdb/transactions
- https://appwrite.io/docs/references/cloud/server-nodejs/tablesDB

## 8. Non-actions

No API route, wallet table, index, secret, workflow, or Appwrite resource was created or changed by this document. No real or demo balance was seeded. Backend implementation remains gated on isolated transaction, concurrency, idempotency, numeric serialization, and runtime compatibility tests.
