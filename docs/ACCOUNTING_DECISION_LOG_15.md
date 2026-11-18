# ACCOUNTING DECISION LOG 15 — ADMIN GIFT HISTORY AND ANALYTICS

Status: Provisional product-design decision only. No live NXC issuance, balance changes, or operational analytics are activated.

## Decision 18 — Dedicated administration gift history with analytics

**Selected option: Option 2 — provide a dedicated “Administration Gift History” page with the full event history and summary statistics.**

For a future disconnected UI preview, the page should include:

### Gift history
- Sent/completed gifts.
- Scheduled gifts.
- Paused recurring schedules.
- Cancelled schedules or drafts.
- Failed or skipped occurrences, with a clear reason.
- Recipient-level records linked to their parent batch or recurring schedule.
- Administrator, recipient, conceptual NXC amount, written reason, timestamp, status, and event reference.

### Summary statistics
- Total conceptual NXC amount in completed administration gifts.
- Number of recipients.
- Number of completed gift events.
- Number of scheduled and recurring gift plans.
- Number of cancelled, failed, or skipped events.
- Date-range filters and clear distinction between completed amounts and merely scheduled amounts.

### Integrity and access
- Historical entries are read-only and cannot be silently edited or deleted.
- Corrections, if ever required, must appear as separately audited events.
- Access is limited to authorized administrative roles; private member information is minimized.
- Statistics must not imply cash value, revenue, or funds available to spend.

## Non-activation boundary

Documentation and disconnected UI design only. NXC and jewels remain conceptual internal app units with no cash value. No real-money top-ups, cash-outs, payouts, member cash marketplace, live transfers, issuance, balance mutation, scheduler jobs, backend/schema/function/workflow changes, secrets, or runtime changes. Any future backend change requires separate explicit approval and a clear redeployment warning.
