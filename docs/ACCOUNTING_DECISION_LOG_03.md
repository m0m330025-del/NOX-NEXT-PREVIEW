# ACCOUNTING DECISION LOG 03 — GIFT ELIGIBILITY AND MEMBER GIFT UI

Status: Provisional product-design record only. No wallet operation, balance, reward, transfer, or backend behavior is activated.

## Decision 05 — Gift events eligible for jewel rewards

**Approved provisional rule: only successfully completed and finalized gift events qualify.**

- Pending, failed, or cancelled-before-completion gift events do not earn jewels.
- Self-gifts remain excluded from jewel rewards under Decision 04.
- Any exceptional correction must be represented by a separately auditable event; never delete or rewrite the original gift event.
- This is a product rule only and is not implemented.

## New product requirement — Send an in-app gift to any user

The user requests that the Transfer area include an option labelled **“هدية” (Gift)**, allowing a member to select any other registered user as the recipient and enter an optional note/message to accompany the gift.

### Safe design scope for a future disconnected UI preview

- Entry point: a clearly labelled “هدية” action in the transfer area.
- Recipient: searchable selection from registered NOX users; show a confirmation of the selected recipient before proceeding.
- Note: optional text field accompanying the gift, with sensible length limits and moderation/reporting controls.
- Confirmation screen: clearly show recipient, the conceptual in-app unit amount if later approved, and the note before any action.
- Gift history: show sender, recipient, note, timestamp, and status in a read-only history view.
- Privacy and abuse controls: prevent impersonation, provide block/report controls, and avoid exposing private account details.

### Important unresolved policy questions

This request does not yet authorize an actual member-to-member NXC transfer. Before even considering implementation, product policy must separately define:
1. Whether “هدية” is only a presentation label for a non-cash in-app gift or a distinct gift event.
2. Whether an amount is involved, and which conceptual unit it uses.
3. Whether there are eligibility, frequency, or abuse-prevention limits.
4. Whether self-recipient selection is blocked (self-gifts do not qualify for jewel rewards regardless).

## Non-activation and safety boundary

This is documentation for product design and a disconnected static UI preview only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, or live transfer operations are permitted. Do not modify backend, schema, function, workflow, secrets, or runtime based on this document. Any future backend change requires a separate explicit approval and a clear redeployment warning.
