# NOX NEXT — Engineering Review Notes (Pre-Implementation)

## Review scope
This is an internal technical review of the two UX specifications:
- `USER_SUPPORT_REQUEST_UX.md`
- `ADMIN_REVIEW_QUEUE_UX.md`

It is not feedback from external or human engineers. No production code, database schema, or Appwrite Function was changed by this review.

## Overall recommendation
The two-screen approach is a sound starting point for a lightweight support and safety workflow. Keep the first release narrow: text-only requests, clear status tracking, private staff handling, and no identity-document upload.

## Recommended changes before UI implementation

### 1. Align request categories
The user screen currently offers:
- Technical issue
- Abuse/content report
- Account issue
- Suggestion/question

The admin screen currently says Support, Report, Account appeal. These labels do not map one-to-one. Use stable backend category keys and Arabic display labels:
- `technical_support` — مشكلة تقنية
- `safety_report` — بلاغ أمان أو إساءة
- `account_help` — مساعدة بشأن الحساب
- `feedback` — اقتراح أو استفسار

Do not expose a general account appeal category until the appeal process and its scope are defined.

### 2. Align status names
Use one canonical status set across user and admin screens:
- `new` — جديد
- `in_review` — قيد المراجعة
- `needs_information` — نحتاج معلومات إضافية
- `resolved` — تم الحل
- `closed` — مغلق

If escalation is needed, model it as a separate priority/assignment field rather than a user-visible status. This keeps the user's progress understandable.

### 3. Add operational fields
For staff workflow, add:
- Priority: normal / urgent
- Assigned staff member
- Last activity timestamp
- Resolution summary
- Optional linked report/reference ID

Urgent priority must be reserved for credible immediate safety concerns and should not be a public self-selected shortcut.

### 4. Clarify replies and notifications
- Keep a public conversation thread separate from internal staff notes.
- Notify the user when staff request more information or resolve a request.
- Do not expose staff-only notes in user request history.
- Show a clear empty state when the user has no requests.

### 5. Keep v1 text-only
Do not accept file attachments in the first release. This reduces malware, privacy, moderation, storage, and retention risks. If attachments are later required, define file type/size limits, malware scanning, private storage, access checks, and deletion rules first.

### 6. Define service expectations
- Explain that requests are not monitored as an emergency service.
- Show expected response-time wording only after the team has agreed to a realistic service target.
- Provide a separate report path for urgent safety concerns, with suitable local guidance reviewed by the product owner.

### 7. Backend and data design gates
Before creating tables or endpoints, specify:
- Request ownership and staff role model
- Public replies vs internal notes
- Append-only audit events
- Rate limits and duplicate-submission handling
- Retention/deletion rules
- Authorization tests for cross-user access and staff-only data
- Server-generated request IDs and timestamps

## Suggested v1 screen composition

### User
1. Header: المساعدة والدعم
2. Category selector
3. Message field with 2,000-character counter
4. Privacy reminder
5. Submit button with honest demo/disabled state until backend exists
6. My requests list with status and latest public reply

### Admin
1. Counters: جديد / قيد المراجعة / تم الحل
2. Filters: category, status, priority, assigned staff
3. Queue table/list
4. Request detail panel
5. Public reply composer
6. Separate internal note field
7. Status, assignment, and priority controls
8. Audit history

## Decision checklist for the engineering team
- [ ] Confirm the four category keys and Arabic labels.
- [ ] Confirm the five canonical statuses.
- [ ] Confirm whether priority is needed in v1.
- [ ] Confirm text-only v1 and no attachments.
- [ ] Confirm notification channel and service expectations.
- [ ] Approve ownership, staff roles, and audit requirements.
- [ ] Approve data retention and deletion rules.

## Release boundary
This workflow is for support and safety moderation only. It must not act as identity verification, age assurance, membership approval, or a route into restricted areas. Keep any restricted-area access controls separate.
