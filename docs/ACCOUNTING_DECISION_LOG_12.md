# ACCOUNTING DECISION LOG 12 — DEFAULT AMOUNT FOR ADMIN ALL-MEMBER GIFTS

Status: Provisional product-design decision only. No NXC issuance, balance change, or live bulk operation is activated.

## Decision 15 — Uniform default amount with per-member override

**Selected option: Option 1 — set one common NXC amount for all selected eligible members, while allowing the administrator to adjust an individual member's amount before final review.**

For a future disconnected UI preview:
- The administrator enters one default conceptual NXC amount.
- The amount is initially applied to every member in the reviewed eligible-recipient snapshot.
- The administrator may override the amount for an individual recipient.
- The review screen displays every recipient and their final individual amount.
- The review screen recalculates and displays the aggregate conceptual total after any edits.
- The required written reason and recipient snapshot are preserved with the batch review.
- No operation occurs from the preview; explicit future approval and implementation review would be required.

## Non-activation boundary

This is documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, issuance, or wallet mutation. Do not modify backend, database schema, functions, workflows, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
