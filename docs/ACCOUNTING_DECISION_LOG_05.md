# ACCOUNTING DECISION LOG 05 — SELF-RECIPIENT RESTRICTION FOR MEMBER GIFTS

Status: Provisional product-design decision only. No live transfer or wallet operation is activated.

## Decision 07 — Self-recipient restriction

**Selected option: Option 1 — a member cannot send an NXC-denominated member gift to their own account.**

- The recipient must be a different registered NOX account.
- The server-side identity check must compare authenticated account identifiers; client-provided names or NOX IDs are not authoritative.
- The UI should prevent selecting the sender's own account and explain why.
- This restriction applies to the member-to-member “هدية” flow.
- Existing jewel eligibility rules remain separate: self-gifts do not earn jewels.

## Current member-gift design summary

- Entry point is labelled “هدية” in the transfer area.
- Sender selects another registered member.
- Sender specifies a conceptual NXC amount and may add a note.
- On a future approved flow, the amount is deducted from sender's in-app NXC balance and credited to recipient's in-app NXC balance.
- Both parties have a gift-history record.
- A confirmation summary is shown before submission.
- No cash value, cash-out, payout, or cash marketplace is part of this design.

## Non-activation boundary

This is documentation and disconnected UI design only. Do not implement or activate live wallet transfers, modify backend/schema/function/workflows/secrets/runtime, or create balances. Any future backend change requires separate explicit approval and a clear redeployment warning.
