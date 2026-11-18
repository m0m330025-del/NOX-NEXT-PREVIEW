# ACCOUNTING DECISION LOG 04 — MEMBER GIFT RECIPIENT CREDIT

Status: Provisional product-design decision only. This does not authorize or activate a live transfer, wallet mutation, backend implementation, or cash-equivalent activity.

## Decision 06 — Destination of NXC-denominated member gifts

**Selected option: Option 1 — the gift amount is credited to the recipient's in-app NXC balance.**

For a future conceptual product flow:
- The sender chooses another registered NOX account and a gift amount.
- The amount is conceptually deducted from the sender's available NXC balance and credited to the recipient's in-app NXC balance.
- An optional note accompanies the gift.
- The sender and recipient see the event in their respective gift histories.
- The flow must show a clear confirmation summary before submission.

## Important distinction from jewel rewards

- This member-to-member gift is a distinct gift/transfer event; it is not automatically the same as a catalog gift sent inside a room.
- A member-to-member NXC gift does not itself generate jewel rewards for the recipient.
- The previously approved jewel rule remains: only completed and confirmed eligible catalog gift events earn jewels; self-gifts are excluded.
- This design decision does not alter the previously recorded platform-reserve treatment for NXC spent on catalog gifts.

## Outstanding design safeguards

Before any implementation is considered, define:
- Whether the sender can gift only to other accounts (recommended: self-recipient disallowed).
- Any per-event or frequency limits and abuse controls.
- Whether a gift can be reversed; preserve immutable history and use a separately audited correction event if ever needed.
- Recipient confirmation and notification behavior.
- Privacy, blocking, reporting, and note moderation rules.

## Non-activation and safety boundary

NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, or live transfer operations. This record is for documentation and disconnected UI design only. Do not change backend, database schema, function, workflow, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
