# ACCOUNTING DECISION LOG 06 — IMMEDIATE MEMBER GIFT CREDIT

Status: Provisional product-design decision only. No live transfer or wallet operation is activated.

## Decision 08 — Recipient acceptance

**Selected option: Option 2 — the member gift is credited directly after the sender confirms it.**

- The recipient does not need to accept or reject the gift.
- In a future approved conceptual flow, the sender sees a final confirmation summary before sending.
- Once confirmed, the gift event is recorded for both sender and recipient.
- The recipient receives an in-app notification and can view the accompanying note.
- The UI must clearly distinguish a completed gift from a pending or failed action.

## Related existing decisions

- The recipient must be another registered NOX account; self-recipient is disallowed.
- The conceptual NXC amount is deducted from the sender's in-app balance and credited to the recipient's in-app balance.
- An optional note accompanies the gift.
- The member-to-member gift does not itself generate jewel rewards.
- Gift history is visible to both parties.

## Non-activation boundary

This is documentation and disconnected UI design only. NXC and jewels are conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, or live transfer operations. Do not modify backend, schema, function, workflows, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
