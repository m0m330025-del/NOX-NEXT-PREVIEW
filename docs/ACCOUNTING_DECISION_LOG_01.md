# NOX NEXT — Accounting Decision Log 01

**Date:** 2026-11-18  
**Status:** Provisional product-design decision only; not implemented or activated.

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

## Next open decision — NXC source for jewel conversion

Choose one policy for future design review:

1. **Existing platform reserve:** the NXC credit created by a jewel conversion is funded by debiting the platform-controlled NXC reserve. The reserve must have sufficient available units; it cannot become negative.
2. **Authorized issuance:** conversion creates newly authorized NXC through a dedicated issuance control account, subject to an approved cap and audit policy.

No conversion is enabled until the source policy and its controls are approved and tested in a non-production environment.
