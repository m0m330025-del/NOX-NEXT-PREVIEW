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

## Next open decision — Jewel reward cap

The existing reward rule is 1 jewel per 1 NXC of eligible virtual gifts received. A maximum reward cap has not yet been decided.

Options for further product review:
1. **No additional cap:** apply the 1:1 rule to all eligible gifts, with anti-abuse controls and eligibility rules still required.
2. **Fixed cap:** apply the 1:1 rule only up to a defined maximum per member per defined period; excess eligible gift value does not generate additional jewels for that period.

No reward or conversion is enabled until eligibility, abuse controls, reconciliation, and non-production tests are specified and approved.
