# NOX NEXT — NXC Transfer State Machine & Failure Matrix

**Status:** Design and test specification only; not implemented or deployed.  
**Branch:** `feature/moderation-functions-scaffold`  
**Related:** `NXC_WALLET_API_CONTRACT.md`, `WALLET_GIFTS_JEWELS_SCHEMA_BLUEPRINT.md`, `LEDGER_INVARIANTS_AND_POSTING_RULES.md`

## 1. Scope and safety boundary

This document specifies the lifecycle of an internal NXC transfer for future engineering review. It does not enable transfers, create balances, add database tables, or authorize real-value exchange. NXC remains an in-app unit. There is no cash-out, cash marketplace, payout, escrow, or member-to-member money exchange.

Implementation remains blocked until a suitable non-production environment proves transaction atomicity, concurrency behavior, idempotency, numeric serialization, and runtime compatibility. Any backend change on the branch connected to the Appwrite Function may trigger redeployment and requires separate explicit approval.

## 2. State model

A transfer request has these conceptual states:

| State | Meaning | Client presentation |
|---|---|---|
| `RECEIVED` | Request reached the server; no posting has occurred | Processing |
| `VALIDATED` | Session, recipient, amount, wallet status, and idempotency binding passed | Processing |
| `POSTING` | A single database transaction is staging all required rows | Processing |
| `COMMITTED` | Database confirmed the atomic commit | Completed receipt |
| `REJECTED` | Validation failed before any posting | Clear error |
| `CONFLICT` | Idempotency payload mismatch or transaction conflict requiring safe retry/reconciliation | Not completed; retry guidance |
| `UNKNOWN` | Server cannot yet establish whether the commit succeeded | Checking status; never claim success or failure |

Terminal business outcomes are `COMMITTED` and `REJECTED`. `CONFLICT` is not permission to create a new transfer blindly. `UNKNOWN` is an operational uncertainty, not a transaction result.

Do not expose internal database transaction states as if they were a member-facing payment status.

## 3. Required invariants

1. Sender identity is derived only from the authenticated session.
2. Recipient is resolved server-side from the submitted NOX ID.
3. Amount is a positive bounded integer in the approved safe range.
4. The sender and recipient must be distinct and eligible.
5. Sender and recipient wallet rows, transaction envelope, and exactly two balanced NXC journal entries are one atomic unit.
6. No committed transfer may leave only the debit or only the credit.
7. A committed transfer has one immutable receipt and one unique idempotency binding.
8. Repeating the same key and canonical payload returns the original outcome; it never posts again.
9. Reusing a key with a different canonical payload returns `idempotency_conflict`.
10. A timeout or lost response is not proof that the transaction failed.
11. Notifications are emitted only after commit and cannot change the ledger outcome.
12. Client-supplied balances, sender IDs, recipient account IDs, prices, fees, or statuses are ignored/rejected as authoritative data.

## 4. Idempotency contract

The idempotency namespace is scoped to the authenticated sender and operation type. The canonical payload includes at minimum:

- operation type;
- authenticated sender account identity (server-derived);
- normalized recipient identity (server-resolved);
- integer amount;
- contract/version identifier.

The server stores a cryptographic hash of that canonical payload with the idempotency key. The raw key must be bounded in length and treated as opaque input.

| Existing key | Payload hash | Required result |
|---|---|---|
| No record | — | Validate and attempt one posting |
| Existing committed record | Same | Return the original receipt; no new ledger writes |
| Existing in-progress/uncertain record | Same | Return processing/status-check response; do not start a second posting |
| Existing record | Different | `409 idempotency_conflict`; no writes |
| Existing rejected record | Same | Return the same rejection outcome, unless an explicitly documented retry policy defines a new request key |

A client retry after timeout must use the same key. A new key is a new request and must never be silently inferred as a retry.

## 5. Processing sequence

1. Authenticate and derive the sender.
2. Validate request shape, key format, and bounded integer amount.
3. Resolve the NOX ID without disclosing whether arbitrary accounts exist.
4. Reject self-transfer, restricted/unavailable recipients, and restricted sender wallets.
5. Canonicalize the request and inspect the idempotency record.
6. Start one short-lived TablesDB transaction.
7. Re-read the wallet rows inside the transaction boundary and verify sufficient sender balance.
8. Stage the transaction envelope, sender debit projection, recipient credit projection, and the two journal entries.
9. Commit once.
10. Return `COMMITTED` only after commit confirmation.
11. Publish an idempotent post-commit notification/outbox event.
12. On retry, resolve the original idempotency record before considering any new write.

The exact SDK method calls and transaction conflict/retry behavior are intentionally unspecified until verified against the pinned SDK and an isolated Appwrite project.

## 6. Failure matrix

| Failure point | Expected durable state | API behavior |
|---|---|---|
| Authentication fails | No rows written | `401 authentication_required` |
| Amount/recipient validation fails | No rows written | Stable validation error |
| Insufficient balance | No rows written | `409 insufficient_balance` |
| Idempotency key reused with different payload | Existing record unchanged | `409 idempotency_conflict` |
| Transaction staging fails before commit | Transaction rolled back; no partial posting | `503 service_unavailable` or safe retry response |
| Commit reports conflict | No partial posting | `409 transaction_conflict`; bounded retry only after re-reading state |
| Commit succeeds, response is lost | One committed transfer exists | Retry with same key returns original receipt |
| Commit outcome cannot be determined | Do not start a second posting | `202`/status-check response; reconcile by idempotency reference |
| Notification fails after commit | Transfer remains committed | Receipt remains successful; notification retries separately |
| Receipt lookup by nonparticipant | No private data disclosed | Generic unavailable response |

A commit timeout must be treated as `UNKNOWN` until the server reconciles the transaction/idempotency record. It must not be converted into a fresh posting.

## 7. Concurrency requirements

The following must be tested against a non-production TablesDB service, not merely mocked:

- Two simultaneous sends from one wallet where combined amount exceeds the available balance: at most one may commit.
- Two simultaneous sends to the same recipient: both may commit only if sender funds and transaction isolation permit.
- Opposing transfers (A to B and B to A): no deadlock loop, partial posting, or lost update.
- Same idempotency key submitted concurrently: exactly one posting and one shared receipt.
- Distinct keys submitted concurrently: each request independently validates the latest committed balance.
- A transaction conflict retry must re-read both wallet rows and re-evaluate sufficient balance.

Retries must be bounded. Do not retry arbitrary failures or repeat a posting after an uncertain commit without first reconciling the original key.

## 8. API response semantics

- `COMMITTED`: includes opaque transaction reference, amount, unit, timestamp, and the caller's resulting balance projection.
- `REJECTED`: includes a stable safe error code; no ledger reference.
- `CONFLICT`: explicitly states that no new transfer was confirmed; client must not change the key automatically.
- `UNKNOWN`: returns a status reference or instructs the client to query the same request status using the same idempotency key. It must not display a success animation or completed receipt.
- Never return raw database errors, stack traces, internal row IDs, or another member's wallet details.

## 9. Required automated test cases

### Validation
- unauthenticated request;
- malformed NOX ID;
- self-transfer;
- zero, negative, fractional, non-numeric, and over-limit amount;
- restricted sender or recipient;
- insufficient balance;
- extra caller-supplied sender/balance/status fields.

### Idempotency
- same key + same payload sequentially;
- same key + same payload concurrently;
- same key + changed amount;
- same key + changed recipient;
- retry after server response is lost;
- replay of a previously rejected request.

### Atomicity and accounting
- failure while staging each required row;
- rollback leaves projections and journals unchanged;
- committed transfer has exactly two equal-and-opposite user-wallet entries;
- sum of entries per transaction balances to zero under the chosen ledger convention;
- wallet projections reconcile to journal-derived balances.

### Concurrency and recovery
- simultaneous overspend attempts;
- simultaneous inbound credits;
- opposing transfers;
- conflict followed by bounded retry;
- ambiguous commit followed by idempotency reconciliation;
- notification failure after commit;
- receipt access by sender, recipient, and unrelated account.

No test should seed or display a real or plausible member balance. Use isolated synthetic fixtures clearly marked as test-only.

## 10. Release gates

Do not implement or enable this flow until all are true:

- exact `node-appwrite@31.3.0` transaction API and numeric round-trip are verified;
- Node runtime policy is aligned with the actual Appwrite Function runtime;
- schema migration validates existing column definitions and indexes;
- all tests above pass against an isolated non-production Appwrite project;
- ledger rebuild matches wallet projections;
- authorization and privacy review passes;
- a separate approval is obtained for backend changes and possible Appwrite Function redeployment.

## 11. Explicit non-actions

This document adds no routes, tables, indexes, secrets, workflows, UI success states, or Appwrite resources. It does not enable NXC transfers, seed balances, or perform any financial operation.
