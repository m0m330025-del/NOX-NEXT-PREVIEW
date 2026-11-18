# Registration Rejection Reason Decision 01

**Project:** NOX NEXT  
**Status:** Approved as a product requirement  
**Decision:** A rejection reason is mandatory when an administrator rejects a registration request.

## Requirement
- The administrator must enter a reason before confirming rejection.
- The reason is stored with the registration decision and its timestamp.
- The reason is available to authorized administrators in the request history.
- Do not store identity-card images, full identity numbers, or handwritten signatures in NOX NEXT as part of this workflow.
- This is a product/documentation decision only. It does not implement backend changes, collect identity documents, send messages, or activate accounts.

## Registration review flow
The registration review screen shows the applicant name, NOX ID, request creation date, and current status. Authorized administrators can approve and activate or reject the request. Rejection requires a written reason; administrative notes remain available as a separate field.
