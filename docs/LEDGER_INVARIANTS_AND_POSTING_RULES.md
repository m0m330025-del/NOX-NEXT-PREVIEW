# NOX NEXT — Ledger Invariants & Posting Rules

**Status:** Accounting design proposal only. Not implemented.
**Branch:** `feature/moderation-functions-scaffold`
**Depends on:** `NXC_WALLET_LEDGER_SCHEMA_REVIEW.md`, `JEWELS_DATA_MODEL_API_TEST_PLAN.md`

## 1. Non-negotiable accounting invariants

1. A wallet balance is a projection, not the audit source of truth.
2. Every posted journal entry is immutable. Never update or delete a committed entry.
3. Every journal transaction balances **within its own unit/currency**. NXC debits must equal NXC credits. Jewel debits must equal jewel credits. Do not add unlike units together.
4. A transaction's rows, wallet projections, feature event/receipt, and journal entries must commit atomically.
5. Every posting has a unique transaction reference and idempotency identity.
6. A posted transaction cannot be silently cancelled. Correct mistakes with a separately authorized, linked reversal/adjustment.
7. All amounts are positive integers; direction carries debit/credit semantics. No floating-point arithmetic.
8. No client-supplied account IDs, ledger direction, amount, source, price, or reward multiplier is trusted.
9. No user cash balance, cash-out, NXC-to-cash conversion, member cash marketplace, escrow, or payout ledger is part of NOX.

## 2. Separate journals by unit

Maintain distinct accounting units:
- **NXC** — spendable in-app wallet currency.
- **JEWEL** — reward unit earned by eligible female accounts.

A conversion is a linked exchange between two separately balanced journals. It is not valid to make a journal balance by adding 20 JEWEL to 10 NXC.

The approved conversion remains:
- 1 NXC of qualifying received gift catalog value awards 1 JEWEL.
- 2 JEWEL converts to 1 NXC.
- Odd JEWEL remainder remains available.
- Conversion never reduces historical gift progression.

## 3. Illustrative posting patterns

The following are logical posting examples, not approved general-ledger account mappings. The canonical system accounts and accounting treatment must be reviewed before implementation.

### 3.1 Internal transfer — 100 NXC

| NXC account | Debit | Credit |
|---|---:|---:|
| Sender wallet | 100 | 0 |
| Recipient wallet | 0 | 100 |
| **Total** | **100** | **100** |

Both wallet projections and both journal entries commit in one transaction.

### 3.2 Purchase top-up — 10,000 NXC

A trusted payment-provider event may authorize a top-up. The exact platform issuance/clearing account model and payment reconciliation policy are not yet approved.

The posting must have:
- a verified provider event/reference;
- a unique idempotency key;
- an NXC credit to the user's wallet;
- a matching NXC debit to a controlled platform issuance/clearing account;
- one transaction envelope;
- a reconciliation record linking the provider event to the ledger posting.

A duplicate webhook must return the original result and must not credit again. A client success redirect is not proof of payment.

### 3.3 Gift send — 100 NXC

The sender wallet is debited 100 NXC. The offset must go to a specifically approved platform gift/consumption account, not to a recipient cash account. The completed gift event stores the authoritative gift catalog version and 100 NXC value snapshot.

No gift-revenue share or recipient NXC credit is assumed. Do not invent a split.

### 3.4 Jewel award — 100 JEWEL

For an eligible female recipient of a successfully recorded 100 NXC gift:
- credit 100 JEWEL to the recipient's JEWEL account;
- debit 100 JEWEL from a controlled JEWEL reward-issuance account;
- link the JEWEL posting to the immutable completed gift event;
- enforce one award per source gift.

This JEWEL journal is separate from the NXC gift journal. The award does not create spendable NXC.

### 3.5 Convert 20 JEWEL to 10 NXC

This exchange has two linked, separately balanced journal postings under one parent transaction reference.

**JEWEL journal:**

| JEWEL account | Debit | Credit |
|---|---:|---:|
| User's available JEWEL | 20 | 0 |
| JEWEL conversion clearing | 0 | 20 |
| **Total** | **20** | **20** |

**NXC journal:**

| NXC account | Debit | Credit |
|---|---:|---:|
| NXC conversion issuance/clearing | 10 | 0 |
| User's NXC wallet | 0 | 10 |
| **Total** | **10** | **10** |

Both postings, the jewel balance projection, NXC wallet projection, and conversion receipt must commit atomically. The platform's issuance/clearing policy must explicitly authorize the NXC credit. If the NXC issuance source is not approved and reconciled, conversion stays disabled.

## 4. Required ledger data shape

The existing proposed `nxc_ledger_entries` schema is NXC-specific. Do not overload `amountNxc` to store jewels.

Before implementation, choose one of these designs:
- separate `nxc_ledger_entries` and `jewel_ledger_entries` tables with shared transaction references; or
- one generic journal table with mandatory `unit` field (NXC / JEWEL), integer `amount`, and per-unit balancing validation.

In either design, a posting must identify:
- immutable entry reference;
- parent transaction reference;
- unit;
- controlled account type and account ID;
- debit or credit;
- positive integer amount;
- reason code;
- source event/reference;
- idempotency key;
- server timestamp.

A unique index and server validation must prevent duplicate postings. The chosen model must be verified against actual Appwrite index constraints and transaction behavior.

## 5. Reconciliation rules

For each user and each unit:
- Rebuild the expected balance by replaying committed immutable entries.
- Compare the rebuilt result with the cached wallet/jewel projection.
- Alert on any mismatch; never silently overwrite the journal.
- Freeze the affected operation path while investigating a material discrepancy.
- Resolve discrepancies only through a permissioned, reasoned, linked adjustment entry.

For each logical transaction:
- verify per-unit debit total equals per-unit credit total;
- verify every required feature event/receipt exists;
- verify projection deltas match journal deltas;
- verify one source event maps to at most one award/top-up/conversion.

## 6. Tests required before approval

- NXC transfer balances independently.
- NXC gift debit and approved offset balance independently.
- JEWEL award and JEWEL reward-issuance offset balance independently.
- Conversion creates two balanced unit journals under one parent transaction.
- A missing NXC issuance authorization blocks conversion.
- A failed write to either unit journal rolls back both journals and both projections.
- Duplicate source gift cannot award jewels twice.
- Duplicate payment provider event cannot top up twice.
- Concurrent transfer/conversion cannot overspend.
- Rebuild-from-journal matches wallet and jewel projections.
- Reversal entries link to originals and preserve history.
- Client cannot create or alter journal entries.

## 7. Decisions still required

Before production implementation, product/accounting owners must approve:
1. The canonical platform NXC issuance/clearing account and reconciliation model.
2. The JEWEL reward issuance and conversion clearing account policy.
3. Whether the journal is split by unit or generic with a unit column.
4. Operational limits and maximum supported integer amounts.
5. Who may authorize exceptional adjustments and the required second approval.

Do not create an unlimited owner wallet or literal infinite balance. Any owner/test issuance must be a defined, permissioned, auditable posting.

## 8. Deployment boundary

This document changes no code, schema, Appwrite resources, secrets, or runtime. Backend changes on the connected branch may trigger Appwrite Function redeployment. Keep all future tests in an isolated non-production project.
