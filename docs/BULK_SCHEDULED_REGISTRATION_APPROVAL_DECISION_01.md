# Bulk Scheduled Registration Approval Decision 01

**Project:** NOX NEXT  
**Status:** Product requirement recorded; implementation not authorized.

## Decision
Provide an administrative bulk-approval action so an authorized administrator can approve a group of previously reviewed registration requests together at one chosen date and time.

## Screen behavior
- The administrator selects the exact eligible pending requests to include in the batch.
- Provide a clear action labeled "موافقة على المحدد".
- Before scheduling, show a review summary: selected applicants and NOX IDs, total count, and the chosen execution date and time.
- The administrator chooses the calendar date and time for the batch.
- Display the timezone explicitly as Cairo time (Africa/Cairo).
- Require a final confirmation before saving the scheduled batch.
- Until the scheduled time, requests remain pending and accounts are not activated.
- At execution time, recheck each request's current status and eligibility. Process only requests still eligible; do not overwrite a request that has since been rejected, withdrawn, or otherwise changed.
- Record an auditable result for each request (approved, skipped, or failed), with timestamp and batch ID.
- Allow authorized administrators to view scheduled batches and cancel a batch before it starts. Cancellation must not reverse approvals already completed.
- Do not provide an unrestricted "approve every pending request" action without first showing exactly which requests are included.

## Manual review requirement
Bulk approval does not replace the user's in-person identity-card review and paper-signature process. Only requests the administrator has already reviewed and deliberately selected may be included.

## Scope and safety
This records a product requirement only. No backend, database, scheduling job, messaging, or account activation has been implemented. Any later backend or scheduling implementation requires explicit approval and a redeployment warning because the connected branch may redeploy an Appwrite Function.
