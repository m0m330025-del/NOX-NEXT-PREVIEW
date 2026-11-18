# ACCOUNTING DECISION LOG 14 — RECURRING ADMIN GIFT SCHEDULES

Status: Provisional product-design decision only. Recurrence is not implemented or activated; no NXC issuance, balance change, or live operation is authorized.

## Decision 17 — Recurring administration gifts

**Selected option: Option 1 — the administration gift design should support recurring schedules: daily, weekly, or monthly.**

For a future disconnected UI preview only:
- Scheduling choices: one-time, daily, weekly, or monthly.
- The administrator specifies the start date/time and, where applicable, an end date or number of occurrences.
- Each occurrence uses a clearly displayed recipient snapshot and the approved default amount plus any per-recipient overrides.
- Each occurrence must have its own reviewable record linked to the parent recurring schedule.
- The UI must show the next planned occurrence and the schedule's time zone.
- The administrator can pause, edit, or cancel future occurrences; edits must not rewrite past records.
- Before any future occurrence could be considered, eligibility and authorization would need to be rechecked. A missed or ineligible occurrence must not silently send later.
- The design must display the cumulative planned NXC amount across the selected schedule and the amount per occurrence.
- No automatic execution is implied by this design decision.

## Non-activation boundary

Documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, issuance, balance mutation, scheduler jobs, backend/schema/function/workflow changes, secrets, or runtime changes. Any future backend change requires separate explicit approval and a clear redeployment warning.
