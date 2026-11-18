# ACCOUNTING DECISION LOG 16 — EXPORT ADMIN GIFT HISTORY

Status: Provisional product-design decision only. Export functionality is not implemented or activated.

## Decision 19 — Export formats

**Selected option: Option 1 — support Excel and PDF exports for the Administration Gift History page.**

For a future disconnected UI preview:
- Provide separate “Export Excel” and “Export PDF” actions.
- Exports should respect the currently selected date range and filters.
- Include the report generation timestamp, selected period, summary totals, and recipient-level event details appropriate to the viewer's permissions.
- Clearly separate completed gift amounts from scheduled, paused, cancelled, failed, or skipped items.
- Preserve NXC as an internal unit label; do not imply cash value.
- Restrict export access to authorized administrative roles and avoid unnecessary personal data.
- Exported reports should be read-only snapshots; edits to a report must not change the underlying history.

## Non-activation boundary

Documentation and disconnected UI design only. No live NXC issuance, wallet mutation, transfers, scheduler jobs, or export implementation is activated. Do not modify backend, schema, functions, workflows, secrets, or runtime. Any future backend change requires separate explicit approval and a clear redeployment warning.
