# ACCOUNTING DECISION LOG 07 — MEMBER GIFT NOTIFICATION DETAILS

Status: Provisional product-design decision only. No live transfer, wallet mutation, or notification delivery is activated.

## Decision 09 — Immediate gift notification

**Selected option: Option 1 — notify the recipient immediately with sender, gift amount, and note.**

For a future disconnected UI design:
- Show the sender's display name.
- Show the conceptual NXC gift amount.
- Show the optional accompanying note.
- Link the notification to the recipient's gift-history entry.
- Do not expose private account identifiers or other unnecessary personal information.
- Apply normal notification preferences and abuse/reporting controls.

## Current member-gift decisions

1. Entry point labelled “هدية” in the transfer area.
2. Sender selects another registered NOX member; self-recipient is disallowed.
3. Sender adds a conceptual NXC amount and optional note.
4. The recipient does not need to accept or reject; after sender confirmation, the intended product behavior is direct credit to the recipient's in-app NXC balance.
5. Recipient notification includes sender, amount, and note.
6. Both parties can view the gift in their histories.
7. Member-to-member gifts do not themselves earn jewel rewards.

## Non-activation boundary

This is documentation and disconnected UI design only. NXC and jewels are conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, or live notifications. Do not modify backend, database schema, functions, workflows, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
