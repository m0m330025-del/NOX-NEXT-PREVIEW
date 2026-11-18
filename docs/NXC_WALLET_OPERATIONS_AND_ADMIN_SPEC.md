# NOX NEXT — NXC Wallet Operations & Admin Specification

**Status:** Product and engineering specification only; not implemented.
**Branch:** `feature/moderation-functions-scaffold`
**Depends on:** `WALLET_GIFTS_JEWELS_SCHEMA_BLUEPRINT.md`, `LEDGER_INVARIANTS_AND_POSTING_RULES.md`.

## 1. Wallet purpose and boundaries

Each NOX account has exactly one central NXC wallet. The wallet is used for approved in-app actions only: receiving NXC credits, internal NXC transfers, gifts, and paid in-app features such as games where enabled.

NXC is an in-app unit. This specification does not provide cash-out, bank/mobile-wallet withdrawals, NXC-to-cash exchange, member cash trading, listings, escrow, payouts, or off-platform payment coordination. The app must not display a cash balance for members.

The app owner is the sole authorized source for original NXC issuance/sales. No admin or client can mint arbitrary NXC or directly edit a wallet balance. A real-money purchase flow, if later approved for an eligible deployment, requires a separately reviewed payment-provider integration and trusted server confirmation; a client redirect or screenshot is never proof of payment.

## 2. Member wallet screen

### Main summary
- Current spendable NXC balance, formatted as a whole number.
- NOX ID and account display name.
- Clear distinction between available NXC and any pending operation (pending amounts are not spendable).
- Last successful wallet activity and a link to full history.

### Member actions
- View wallet history.
- Transfer NXC to another NOX account using NOX ID.
- Review the recipient's display name before confirming.
- View approved in-app purchase options where available.
- Open gift and game purchase surfaces; each surface must show the exact NXC cost before confirmation.

Do not show cash-equivalent balances, cash-out buttons, bank details, or member-to-member cash offers.

### Transfer confirmation
1. Enter recipient NOX ID and integer NXC amount.
2. Server resolves the NOX ID and returns the recipient display name.
3. User confirms the displayed recipient and amount.
4. Server validates session, account status, amount bounds, available balance, recipient status, self-transfer prohibition, rate limits, and idempotency.
5. Server performs one atomic debit/credit transaction.
6. UI shows success only after durable commit; otherwise it shows a safe failure state and does not optimistically alter the authoritative balance.

A transfer cannot be reversed by editing history. Any exceptional integrity correction must use a separately authorized, audited reversal.

## 3. Wallet history

Every member-visible history item is derived from committed server records and shows:
- Date and time.
- Operation type: credit, received transfer, sent transfer, gift purchase, in-app feature purchase, jewels conversion, or approved correction.
- Amount with explicit plus/minus direction.
- Status: completed, pending (only where a real pending workflow exists), or failed.
- A short reference/receipt ID.
- Counterparty display name for an internal transfer, without exposing private account data.

History is read-only. Failed attempts do not appear as completed ledger entries. A pending provider payment must not be shown as spendable credit.

## 4. Posting rules by operation

### 4.1 Internal transfer
One parent transaction; sender wallet decreases; recipient wallet increases; two NXC journal entries balance. Both wallet updates and both entries commit atomically. No fee or commission is assumed by this document.

### 4.2 Gift purchase
Server reads the active gift catalog version and its NXC price. The sender wallet debit, NXC journal posting, completed gift event, and any eligible recipient reward event commit as one verified transaction. A completed gift is final and has no normal cancel action.

### 4.3 Jewels conversion
Use the approved rate of 2 jewels = 1 NXC. Debit only an even jewel amount; retain a single odd jewel. Credit the same central NXC wallet. Link the two unit-specific balanced journals under one parent transaction and commit atomically. Historical gift progression remains unchanged.

### 4.4 Paid in-app feature or game
The server validates the feature's authoritative price and eligibility, then debits the same central wallet. Do not let the client submit a replacement price or arbitrary debit amount. Record the feature/source reference and idempotency key.

### 4.5 NXC credit/top-up
No client-side balance increment. If an approved provider purchase flow is later enabled, credit only after authenticated server-to-server provider confirmation, unique provider-event handling, amount/currency/product reconciliation, and durable atomic posting. Keep this flow disabled until the provider, terms, age/eligibility, and operational controls have been separately approved.

## 5. Admin wallet dashboard

### Read-only overview
- Total number of wallet accounts.
- Aggregate spendable NXC liability across user wallets.
- Credits, transfers, gift debits, feature debits, and jewels-conversion credits for a selected period.
- Pending and failed operation counts where applicable.
- Reconciliation status and latest successful reconciliation timestamp.
- Alerts for negative projection, unbalanced journal, duplicate source event, or unexplained difference.

Aggregate figures are operational accounting data, not a cash balance or proof of revenue.

### Wallet lookup
Authorized staff may search by NOX ID or internal account ID and inspect:
- Current projection balance and wallet status.
- Recent committed transactions.
- Linked immutable ledger entries.
- Restrictions/frozen status and reason.
- Reconciliation result.

Sensitive provider data and authentication secrets must never be shown in this screen.

### Admin permissions
- Support: read-only lookup and support reference creation.
- Finance/accounting reviewer: read-only ledger and reconciliation views.
- Restricted accounting operator: may request an exceptional adjustment, but cannot directly edit balance.
- Second authorized reviewer: required to approve any exceptional adjustment.
- System owner: controls approved issuance policy and catalog configuration, but still cannot bypass immutable ledger posting.

No single dashboard control may set `balanceNxc` directly. Any exceptional adjustment must include a reason code, written rationale, actor, second approver, timestamp, original reference where applicable, and new reversing/adjusting ledger entries. The original transaction remains visible.

## 6. Wallet states

- `active`: normal approved in-app wallet actions.
- `restricted`: read-only or limited actions according to a documented reason and policy.
- `frozen`: no outgoing spending or transfer; inbound handling follows a separately approved rule.
- `closed`: no new wallet actions; records remain retained according to the platform's retention policy.

Status transitions are permissioned, reason-required, and audited. Do not delete wallet or ledger records when an account is restricted or closed.

## 7. Mandatory server-side invariants

1. One wallet per authenticated account; identity is never accepted from an untrusted client field.
2. Integer amounts only; no floating-point arithmetic.
3. Every transaction has a unique immutable reference and idempotency identity.
4. A repeated request with the same key and same payload returns the original result; changed payload with the same key is rejected.
5. A wallet cannot be debited below zero.
6. Concurrent debits cannot overspend the same balance.
7. Ledger entries are append-only; corrections use linked reversals.
8. Every NXC journal transaction balances within NXC accounts.
9. JEWEL entries balance separately; never add NXC and JEWEL values together.
10. Balance projections can be rebuilt from immutable journal entries.
11. The server validates prices from authoritative catalog/configuration data.
12. Success is returned only after the atomic commit is confirmed.
13. Client direct writes to wallets, journals, gift events, and jewel events are denied.
14. Rate limits, authorization checks, audit events, and abuse monitoring apply to all mutation endpoints.

## 8. API surface proposal

These are contracts for later implementation, not live endpoints:
- `GET /v1/me/wallet` — current account's spendable NXC summary.
- `GET /v1/me/wallet/transactions` — paginated current-account history.
- `POST /v1/wallet/transfers` — internal NXC transfer by recipient NOX ID.
- `GET /v1/admin/wallets/{userId}` — authorized read-only wallet inspection.
- `GET /v1/admin/wallet-reconciliation` — authorized reconciliation report.
- `POST /v1/admin/wallet-adjustment-requests` — submit an adjustment request, never direct balance mutation.
- `POST /v1/admin/wallet-adjustment-approvals` — second-person approval of a valid request.

All member endpoints derive the caller from the verified Appwrite session. Admin endpoints require a server-verified role/permission, not a client-supplied flag.

## 9. UI states and error handling

The UI must explicitly handle:
- Loading wallet summary.
- Empty history.
- Insufficient balance.
- Unknown NOX ID.
- Recipient mismatch/cancelled confirmation.
- Self-transfer blocked.
- Wallet restricted/frozen.
- Duplicate request/replayed idempotency key.
- Temporary service or transaction conflict.
- Confirmed success with receipt reference.

On timeout or network interruption, the client must query transaction status by safe reference/idempotency identity before retrying. It must not blindly submit a second debit.

## 10. Required test gates

- One wallet per account and private row security.
- Transfer between two accounts posts exactly two balanced NXC entries.
- Self-transfer and unknown recipient rejected.
- Insufficient balance rejected without partial writes.
- Concurrent transfers cannot overspend.
- Duplicate request cannot double debit/credit.
- Gift purchase and completed gift event are atomic.
- Jewels conversion posts separate balanced JEWEL and NXC journals.
- Failed atomic commit leaves all projections and journals unchanged.
- Projection rebuild matches immutable journal totals.
- Restricted/frozen wallets follow the approved policy.
- Unauthorized admin cannot inspect or adjust wallets.
- No client can directly write balances or ledger records.
- Provider event replay cannot credit twice if a future top-up feature is approved.

## 11. Implementation gates and deployment boundary

Before implementation:
1. Verify pinned Appwrite SDK bigint support and lossless serialization.
2. Verify real multi-table transaction commit, rollback, and concurrency behavior in a non-production Appwrite project.
3. Resolve the Node engine mismatch between the nested function package and deployed runtime.
4. Approve the platform issuance/clearing accounting model.
5. Complete the wallet and jewels integration test suite.
6. Review access control and admin role source.
7. Prepare a separate migration and rollback plan.

This document changes no code, schema, Appwrite resource, secret, or runtime. Backend changes to the connected GitHub branch may trigger an Appwrite Function redeploy, so implementation requires a separate explicit approval.
