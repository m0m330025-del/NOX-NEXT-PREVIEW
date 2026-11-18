# ACCOUNTING DECISION LOG 11 — ADMIN GIFTS TO ALL ELIGIBLE MEMBERS

Status: Provisional product-design decision only. No NXC issuance, balance change, or live bulk operation is activated.

## Decision 14 — All eligible recipients

**Selected option: Option 1 — the administration gift design should support selecting all eligible members in one action.**

For a future disconnected UI preview:
- Provide a clear “Select all eligible members” control.
- Eligibility must be calculated and displayed before review; male members are eligible for administration-issued NXC gifts under the existing rule.
- The administrator must be able to review the recipient count and each recipient's individual conceptual NXC amount.
- The administrator may set or adjust amounts per recipient before final review.
- A required written reason applies to the batch.
- Show the recipient list, per-member amounts, and aggregate conceptual total before confirmation.
- Provide an explicit cancel/back step; do not execute anything from the preview.
- Record recipient-level audit entries linked to one batch reference in the design.

## Safeguards and unresolved design questions

- “All eligible” must not silently include future registrations or accounts that become eligible after the review snapshot.
- Excluded, suspended, or otherwise ineligible accounts must be clearly identified in the preview without exposing unnecessary private information.
- Large recipient sets need pagination/search in the review UI.
- Before any future implementation, define a fixed recipient snapshot, maximum batch size, amount constraints, and authorization policy.
- This decision does not grant permission to mint NXC or modify member balances.

## Non-activation boundary

Documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, issuance, or wallet mutation. Do not modify backend, database schema, functions, workflows, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
