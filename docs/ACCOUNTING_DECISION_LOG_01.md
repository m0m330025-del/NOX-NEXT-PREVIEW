# NOX NEXT — Accounting Decision Log 01

**Date:** 2026-11-18  
**Status:** Provisional product-design decisions only; not implemented or activated.

## Decision 01 — Destination of NXC spent on virtual gifts

**Selected option:** B — Platform-controlled NXC reserve.

When a virtual gift is completed, the sender's NXC wallet is debited by the server-authoritative catalog price. The corresponding balancing credit is posted to a separate platform-controlled NXC reserve account.

### Controls
- The reserve is an internal accounting control account, not a member wallet.
- Reserve units are not available for ordinary member spending.
- No cash value, revenue, profit, or member entitlement is implied.
- No admin may directly edit the reserve or member wallet balances.
- Any later reserve use requires a separately approved, append-only, auditable posting policy.
- This decision is a design rule only; no reserve account, balance, schema, API, or transaction has been created.

## Decision 02 — NXC source for jewel conversion

**Selected option:** 1 — Existing platform-controlled NXC reserve.

When a future jewel conversion is approved, the NXC credit would be funded by a corresponding debit to the platform reserve. The reserve must have sufficient available units and must never become negative.

### Controls
- The jewel debit and reserve debit/member NXC credit must be one atomic accounting operation.
- The conversion must fail without changing either ledger if the reserve is insufficient.
- The reserve cannot be replenished through an unapproved or unexplained issuance.
- NXC and jewel ledgers remain separate and independently reconcilable.
- This is a design decision only; no conversion, reserve account, balance, schema, API, or transaction has been created.

## Decision 03 — Jewel reward cap

**Selected option:** 1 — No additional cap.

The provisional reward rule remains 1 jewel per 1 NXC of eligible completed virtual gifts received, without an additional per-period reward cap.

### Controls
- Anti-abuse and eligibility controls remain mandatory.
- Reward calculation must be based on authoritative completed gift events, not client-submitted values.
- Duplicate event processing must not create duplicate jewel rewards.
- This is a design decision only; no rewards, balances, schema, API, or transactions have been created.

## Next open decision — Self-gifting eligibility

Should a gift sent by a member to the same member account be eligible to generate jewel rewards?

1. **Exclude self-gifts:** a sender and recipient with the same account identity generate no jewel reward.
2. **Allow self-gifts:** self-addressed gifts count under the same 1:1 reward rule.

This decision concerns jewel rewards only; gift display behavior and other progression rules would need separate specification. No reward is enabled pending approval.
