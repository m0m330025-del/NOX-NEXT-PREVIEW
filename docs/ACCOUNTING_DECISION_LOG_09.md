# ACCOUNTING DECISION LOG 09 — ADMIN GIFT REASON

Status: Provisional product-design decision only. No NXC grant, wallet mutation, or live operation is activated.

## Decision 12 — Reason for administration-issued NXC gifts

**Selected option: Option 5 — a manually written reason.**

- The authorized administrator must enter a reason before submitting an administration gift request.
- The reason is stored with the gift event and included in its audit record.
- The reason must not be blank; the UI should validate it before showing the final confirmation.
- The system should retain the responsible administrator, recipient, conceptual NXC amount, reason, timestamp, and event reference.
- This decision selects a free-text reason rather than the predefined reason categories listed in the previous proposal.

## Related approved provisional rules

- Male members may receive NXC gifts from the administration only; member-to-member gifts to male accounts are blocked.
- One authorized administrator may approve an administration gift.
- Administration gifts are a distinct auditable grant event, not a manual balance edit.
- No NXC issuance or balance change is activated.

## Non-activation boundary

Documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. Do not implement or activate live wallet operations, issuance, backend/schema/function/workflow changes, secrets, or runtime changes. Any future backend change requires separate explicit approval and a clear redeployment warning.
