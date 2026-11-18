# ACCOUNTING DECISION LOG 10 — ADMIN NXC GIFTS TO MULTIPLE MEMBERS

Status: Provisional product-design decision only. This does not authorize NXC issuance, balance changes, or live group operations.

## Decision 13 — Multiple recipients

**Selected option: Option 2 — the administration gift design should support selecting a group of members in one workflow, with a separately specified amount for each recipient.**

For a future disconnected UI preview:
- The administrator can select multiple eligible recipient accounts.
- Each recipient has an individually displayed amount; amounts need not be equal.
- A written reason is required for the overall gift action.
- Before confirmation, show a review list containing each recipient and their individual amount, plus the total conceptual amount.
- Provide a way to remove a recipient or correct an amount before final review.
- The audit design must preserve recipient-level event records, linked to one parent batch reference, with the responsible administrator, reason, timestamp, and status.
- Do not provide bulk balance-editing or direct minting controls.

## Existing constraints

- Male members may receive NXC gifts from administration only.
- One authorized administrator is sufficient for approval under the provisional rule.
- A non-empty, manually written reason is required.
- Administration gifts are a distinct auditable grant event, not a manual balance edit.
- No actual NXC issuance or balance change is authorized.

## Non-activation boundary

Documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, issuance, or wallet mutation. Do not modify backend, database schema, functions, workflows, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
