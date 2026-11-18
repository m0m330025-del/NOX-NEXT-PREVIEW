# ACCOUNTING DECISION LOG 08 — GIFT RECIPIENT ELIGIBILITY BY MEMBER TYPE

Status: Provisional product-design clarification only. No live wallet operation, NXC issuance, or transfer is activated.

## Decision 10 — Men do not receive member-sent gifts

**User clarification:** Male members do not receive gifts from other members. The only gifts they may receive are from the administration, and those gifts are NXC.

Product rules to reflect in a future disconnected UI:
- A member-to-member gift addressed to a male account must be blocked before confirmation.
- The UI should explain that male members can receive NXC gifts only from the administration.
- An administration-issued NXC gift is a separate event type from a member-to-member gift.
- Administration-issued gifts must be represented as auditable, authorized grant events with actor, reason/note, amount, timestamp, and event reference; do not implement them as manual balance editing.
- Member-to-member gift eligibility for other recipient types remains subject to the separately approved rules.
- The previous notification, note, history, and immediate-credit decisions apply only where the recipient is eligible.

## Open policy details

The user has not yet specified:
- Which administrator roles may authorize an administration-issued NXC gift.
- Whether an approval by a second administrator is required.
- What reason categories and audit visibility are required.

## Non-activation and safety boundary

This is documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, or NXC issuance are activated. Do not modify backend, schema, function, workflows, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
