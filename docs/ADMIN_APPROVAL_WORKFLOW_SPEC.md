# NOX NEXT — Administrator Approval Workflow Specification

**Status:** Staging workflow specification  
**Date:** 2026-11-18  
**Scope:** Requirements only

## Individual request queue

Display only the operational information needed for review:
- Member display name
- NOX ID
- Request date/time
- Current state
- Administrative action controls

Provide:
- Approve action for eligible `PENDING_REVIEW` requests.
- Reject action that requires a reason.
- Notes field for internal administrative notes.
- Confirmation step showing the target member and intended action.
- Clear success, conflict, and failure results.

The application must not collect or store the identity card or paper signature. The owner performs that review outside the application.

## Authorization and audit

- All admin screens and actions require server-verified administrator authorization.
- A hidden button or client-side role check is not access control.
- Each decision uses a conditional state transition from the expected current state.
- Record actor, target, previous/new state, timestamp, reason/category, and outcome.
- Do not expose internal notes in member-facing screens.

## Scheduled bulk approval

The owner may select a group of already-reviewed pending requests and schedule a single bulk approval.

Before final confirmation, show:
- Exact selected member names and NOX IDs
- Total selected count
- Scheduled calendar date and local time
- Explicit timezone: Africa/Cairo
- A clear statement that the batch becomes committed after confirmation

After final confirmation:
- The schedule is immutable in the admin interface; there is no cancel action, matching the owner's product decision.
- The server, not a browser tab or client clock, executes the batch.
- Execution revalidates each selected account independently.
- Only records still in `PENDING_REVIEW` and otherwise eligible may be approved.
- Changed, missing, rejected, suspended, or otherwise ineligible records are skipped and audited; the batch must never force an approval.
- Record a per-member outcome: approved, skipped, or failed.
- Protect against duplicate execution and concurrent workers with an idempotency key/unique execution record.
- Use a trusted server clock and explicit `Africa/Cairo` timezone conversion, including daylight-saving transitions.

The no-cancel product rule does not override safety revalidation. A committed batch may finish with skipped members if their state changes before execution.

## Operational safeguards

- Require a final confirmation that repeats the exact immutable snapshot.
- Prevent accidental double submission.
- Restrict batch creation and execution to authorized administrators.
- Keep an immutable audit trail for schedule creation and each member outcome.
- Never execute a scheduled approval from frontend JavaScript.
