# ACCOUNTING DECISION LOG 13 — SCHEDULED ADMIN GIFT DESIGN

Status: Provisional product-design decision only. Scheduling is not implemented or activated; no NXC issuance, balance change, or live operation is authorized.

## Decision 16 — Schedule administration gifts

**Selected option: Option 1 — the administration gift UI should include a future scheduling option.**

For a future disconnected UI preview only:
- The administrator may choose “Send now” or “Schedule for later”.
- For scheduled previews, the administrator selects a date, time, and applicable time zone.
- The review screen displays the selected recipient snapshot, default amount, per-recipient overrides, aggregate conceptual total, written reason, and scheduled time.
- The UI clearly labels a scheduled item as “Scheduled — not sent”.
- The design must include a way to review or cancel a scheduled draft before its scheduled time.
- The design must define what happens if an account becomes ineligible before the scheduled time; no automatic send should be assumed.
- Scheduling does not bypass authorization, eligibility checks, audit records, or final safeguards.

## Non-activation boundary

This is documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, issuance, balance mutation, scheduler jobs, backend/schema/function/workflow changes, secrets, or runtime changes. Any future backend change requires separate explicit approval and a clear redeployment warning.
