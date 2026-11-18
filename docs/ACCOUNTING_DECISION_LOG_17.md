# ACCOUNTING DECISION LOG 17 — ADMIN GIFT HISTORY ACCESS

Status: Provisional product-design decision only. No live permissions or operations are activated.

## Decision 20 — Who can access the Administration Gift History

**Selected option: Option 2 — the system administrator and explicitly authorized administrative staff may access the history.**

Requirements for a future implementation:
- Access is role/permission-based and follows least privilege.
- Only explicitly granted roles can view the history.
- Export permissions are separately controlled; viewing history does not automatically grant Excel/PDF export rights.
- Sensitive recipient details are shown only when needed for the assigned administrative task.
- Record access and export events in an audit trail, including actor, timestamp, action, and relevant report/filter scope.
- No administrator may alter or delete historical gift events through the history interface.

## Non-activation boundary

This records a product decision only. It does not create roles, permissions, audit events, exports, or backend functionality. No live NXC issuance, wallet mutation, or scheduled operations are activated. Any backend/schema/function/workflow/runtime change requires separate explicit approval and a clear redeployment warning.
