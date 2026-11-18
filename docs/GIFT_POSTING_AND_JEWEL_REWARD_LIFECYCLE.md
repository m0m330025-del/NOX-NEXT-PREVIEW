# NOX NEXT — Gift Posting & Jewel Reward Lifecycle

**Status:** Product and engineering specification only; not implemented or deployed.  
**Branch:** `feature/moderation-functions-scaffold`  
**Related:** `NXC_WALLET_API_CONTRACT.md`, `WALLET_GIFTS_JEWELS_SCHEMA_BLUEPRINT.md`, `NXC_TRANSFER_STATE_MACHINE_AND_FAILURE_MATRIX.md`

## 1. Purpose and boundaries

This document defines how a virtual gift should be validated, recorded, and rewarded in NOX NEXT. It is a design specification only. It does not create Appwrite tables, routes, balances, or live transactions.

NXC and jewels are internal app units in this design. No cash-out, cash marketplace, payout, escrow, or real-money exchange is part of this flow. Any real payment feature remains disabled and outside this specification.

## 2. Confirmed product rules

- Gift prices come only from the server-controlled, versioned gift catalog.
- The sender's identity comes from the authenticated session.
- The recipient is resolved by the server from the selected NOX account.
- A completed gift is final and has no ordinary cancel action.
- A qualifying gift received by an eligible female account earns jewels at the rate of **1 NXC of gift value = 1 jewel**.
- A 100 NXC qualifying gift therefore awards 100 jewels.
- Jewels convert at **2 jewels = 1 NXC**.
- Converting jewels does not reduce lifetime progression totals.
- Odd jewel remainders are retained; no rounding or silent loss.
- Gift progression, available jewels, and spendable NXC are separate values.
- Men's membership progression is based on qualifying gift value sent; women's progression is based on qualifying gift value received. Thresholds are shared between them.
- No member cash-out or direct admin balance-edit/mint control is allowed.

## 3. Gift lifecycle

| State | Meaning | User-facing treatment |
|---|---|---|
| `RECEIVED` | Authenticated request arrived | Sending |
| `VALIDATED` | Sender, recipient, gift, catalog version, and eligibility validated | Sending |
| `POSTING` | One atomic database transaction is being staged | Sending |
| `COMMITTED` | Debit, gift event, and eligible reward records committed together | Gift sent |
| `REJECTED` | Validation failed before commit | Safe error |
| `UNKNOWN` | Commit result cannot yet be established | Checking status; never show success prematurely |

A completed gift must never transition to a normal cancelled state. Exceptional accounting correction, if ever needed, must be a separate audited and separately approved process; it must not erase the original gift event.

## 4. Atomic posting requirements

For every gift, the same database transaction must include:

1. A unique gift transaction envelope and idempotency binding.
2. Sender NXC wallet debit.
3. The corresponding approved platform-side balancing entry under the chosen ledger convention.
4. Exactly two balanced NXC journal entries for the gift value.
5. An immutable `gift_events` row containing sender, recipient, source module, gift key, catalog version, and price snapshot.
6. For an eligible female recipient only:
   - one immutable `jewel_events` award linked uniquely to the gift event;
   - the matching jewel account projection update;
   - the matching JEWEL journal posting.

The gift event and reward must not be committed separately from the NXC debit. If any required write fails before commit, the entire transaction must roll back. No partial gift or partial reward may remain.

The exact balancing-account policy for gift value and jewel issuance must be approved and documented before implementation. This specification does not invent platform revenue, fees, or member shares.

## 5. Reward eligibility and calculation

Reward calculation is server-side and uses the immutable catalog price snapshot stored for the gift.

`jewelsAwarded = qualifyingGiftValueNxc`

Eligibility is evaluated from trusted account attributes and the approved reward policy version, not from a client flag. If the recipient is not eligible for jewel rewards, the gift still follows the approved gift posting policy, but no jewel award is created.

A gift's reward is unique by `sourceGiftEventRef`. A unique constraint plus transaction-level conflict handling must prevent more than one award for the same gift.

## 6. Progression accounting

Maintain three separate concepts:

- **Lifetime qualifying gift value:** cumulative qualifying gift value used for membership progression.
- **Available jewels:** current unconverted jewel amount.
- **Spendable NXC:** current internal wallet projection.

For sender progression, add the qualifying gift value sent. For recipient progression, add the qualifying gift value received according to the membership rules. Converting jewels changes available jewels and NXC wallet balance, but never subtracts from lifetime progression.

Membership thresholds carried forward:

| Tier | Threshold |
|---|---:|
| Silver | 50,000 NXC |
| Gold | 500,000 NXC |
| Premium | 5,000,000 NXC |
| Premium Gold | 500,000,000 NXC |
| Premium Black | Highest tier; numeric threshold not yet specified |

The thresholds are cumulative lifetime qualifying gift values, not wallet balances. The exact Premium Black threshold remains a product decision and must not be guessed in code.

## 7. Idempotency and retry behavior

The idempotency key is scoped to the authenticated sender and gift-send operation. Its canonical payload binds:

- sender identity (server-derived);
- recipient identity (server-resolved);
- gift key and catalog version;
- source module;
- request contract version.

| Retry case | Required result |
|---|---|
| Same key, same payload, already committed | Return original gift receipt; no new debit or reward |
| Same key, changed recipient or gift | Return `idempotency_conflict`; no write |
| Same key, request still processing | Return processing/status response; do not post again |
| Commit outcome unknown | Reconcile original key before any retry |
| New key after completed gift | Treat as a new gift request and validate normally |

A client must retain and reuse the same key after timeout. It must not generate a new key automatically to bypass an uncertain result.

## 8. Failure matrix

| Failure | Required durable result |
|---|---|
| Authentication or validation failure | No wallet, gift, or jewel writes |
| Insufficient sender balance | No gift and no reward |
| Gift catalog key inactive or version unavailable | Reject before posting |
| Sender and recipient are the same account, if disallowed by product policy | Reject before posting |
| Any staged write fails | Roll back the complete transaction |
| Transaction conflict | No partial commit; bounded retry after re-reading authoritative state |
| Commit succeeds but response is lost | Same idempotency key returns original receipt |
| Reward eligibility lookup fails | Fail closed; do not commit a gift with an uncertain reward outcome |
| Notification fails after commit | Gift remains committed; notification retries independently |

Whether self-gifting is allowed is an explicit product-policy decision and must be resolved before implementation. Until then, default to rejecting it.

## 9. Required tests

### Gift validation
- unauthenticated sender;
- unknown or inactive gift key;
- stale catalog version;
- malformed recipient NOX ID;
- sender equals recipient;
- zero, negative, fractional, or out-of-range catalog price;
- insufficient sender NXC balance;
- client attempts to submit or override price, reward amount, sender ID, or eligibility.

### Atomicity
- failure during NXC debit staging;
- failure during ledger entry staging;
- failure during gift event staging;
- failure during jewel award staging;
- failure during jewel account projection update;
- rollback leaves all projections, events, and journals unchanged;
- successful gift has exactly one gift event and, if eligible, exactly one jewel award.

### Idempotency and concurrency
- same key and payload sequentially;
- same key and payload concurrently;
- same key with different gift or recipient;
- lost response after commit;
- two concurrent gifts competing for the same sender balance;
- duplicate reward attempt for one gift event.

### Reconciliation
- NXC wallet projection matches the NXC journal;
- jewel available balance matches the JEWEL journal;
- lifetime progression equals qualifying immutable gift-event totals;
- jewel conversion does not reduce lifetime progression;
- odd jewel remainder is preserved after conversion.

All tests must use isolated synthetic fixtures clearly marked test-only. Do not seed or show plausible real member balances.

## 10. Admin and support controls

Admin/support views may inspect gift receipts, catalog version snapshots, reward eligibility decisions, and reconciliation status under role-based access. They must not offer ordinary gift cancellation, direct wallet editing, direct jewel editing, or ledger deletion.

Any exceptional correction requires a separate append-only adjustment design, reason code, actor identity, permission checks, independent approval, and immutable audit trail. It must never rewrite the original gift event.

## 11. Implementation gates

Do not implement this flow until:

- TablesDB multi-table commit/rollback is proven in a non-production project;
- the pinned SDK transaction methods and numeric serialization are verified;
- schema and indexes are validated, not silently skipped;
- gift, reward, idempotency, and concurrency tests pass;
- NXC and JEWEL journals reconcile to their projections;
- the balancing-account and reward eligibility policies are formally approved;
- backend changes receive separate approval because the connected branch may trigger Appwrite Function redeployment.

## 12. Explicit non-actions

No routes, schema, indexes, workflows, secrets, or Appwrite resources were changed. No real or demo balance was created. No gift, NXC, or jewel transaction was executed.
