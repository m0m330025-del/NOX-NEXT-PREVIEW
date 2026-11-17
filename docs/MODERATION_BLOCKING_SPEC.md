# NOX NEXT — Blocking, Reporting, and Moderation Specification

## Status

**Design only — no block/report API, moderation dashboard, or enforcement workflow is deployed.**

This document defines the intended safety model. It does not create database tables, grant permissions, suspend accounts, or make moderation features operational. Keep all user access and protected operations behind the existing authentication and eligibility release gates.

## 1. Three distinct controls

### A. User-to-user block

A signed-in user may block another account to control their own interactions.

When A blocks B, the server must:
- Prevent B from sending A direct messages, friend requests, or other one-to-one contact requests.
- Prevent new friend requests between the pair in either direction.
- Hide or suppress direct-contact entry points between the pair in search and profile surfaces where practical.
- Prevent the blocked account from seeing the blocker's online/presence state or private activity where those signals are otherwise available.
- Preserve the blocker's ability to unblock B.
- Avoid notifying B that they were blocked or exposing the blocker's block list.

A block is not a platform-wide suspension. It does not automatically remove content visible to everyone, and it does not stop a user from reporting harmful content through a separate report flow.

### B. Platform-admin suspension

Authorized moderators may restrict an account when a report or other reliable evidence indicates a policy violation.

Supported action types:
- warning
- temporary_suspension
- permanent_suspension
- feature_restriction
- restore (reinstatement; recorded as a new audit event)

Every action must include a reason category, concise moderator rationale, actor ID, creation time, and (for temporary actions) an expiry time. Permanent actions require human review and an appeal path. Only designated moderator roles may perform these actions.

### C. Automated protective limits

Automation may apply short-lived, reversible friction for clearly measurable abuse patterns, such as repeated request attempts or message bursts. Automation must not permanently suspend an account or decide a serious policy violation by itself.

- Use conservative thresholds and short expiry windows.
- Record the rule/version and reason code.
- Provide a clear retry time when a temporary rate limit is shown.
- Allow human review and correction for false positives.
- Never use automation as a substitute for reviewing user reports.

## 2. Reports

A user can report an account or a specific item of content. The report form should collect only:
- target account ID, and optional content/message ID;
- a controlled reason category: harassment, threats, spam, impersonation, privacy, scam, or other;
- a short optional description;
- optional supporting evidence selected by the reporter, limited to what is necessary.

Do not silently copy entire private conversations, contact lists, or unrelated account data into a report. Explain what evidence will be sent before submission. Never expose the reporter's identity to the reported user through the report interface.

Reports must have server-assigned IDs and timestamps and a state machine:
new → under_review → actioned or no_action → optionally appealed / closed.

Duplicate reports may be grouped for moderator review without treating report volume alone as proof. A report is an allegation, not a finding.

## 3. Proposed Appwrite TablesDB data model

These are proposed tables only. Do not add them to the bootstrap workflow until the schema and permission plan have been reviewed.

### blocks

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| blockerId | string | yes | Auth user ID derived by the server |
| blockedId | string | yes | Target Auth user ID |
| createdAt | datetime | yes | Server-generated timestamp |

Add a unique index on (blockerId, blockedId) and indexes for lookups by each side. Reject self-blocks. Repeated block calls must be idempotent.

### reports

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| reporterId | string | yes | Auth user ID derived by the server |
| targetUserId | string | yes | Reported account |
| contentType | string | yes | account, message, profile, or another allow-listed type |
| contentId | string | no | Related content ID |
| reason | string | yes | Allow-listed report category |
| description | string | no | Length-limited user explanation |
| status | string | yes | Server-controlled review state |
| createdAt | datetime | yes | Server-generated timestamp |
| updatedAt | datetime | yes | Server-generated timestamp |

Do not store uploaded identity documents or unnecessary sensitive material in this table. If evidence storage is later required, use private storage, narrow access, retention limits, and a separately reviewed design.

### moderation_actions

| Attribute | Type | Required | Purpose |
|---|---|---:|---|
| targetUserId | string | yes | Account affected |
| actorUserId | string | yes | Moderator or system actor |
| actionType | string | yes | Allow-listed action |
| reasonCode | string | yes | Standardized reason |
| rationale | string | no | Concise internal explanation |
| startsAt | datetime | yes | Server-generated start |
| expiresAt | datetime | no | Required for temporary actions |
| reportId | string | no | Related report |
| createdAt | datetime | yes | Server-generated timestamp |

Treat this as an append-only audit record. Corrections should be recorded as new events rather than silently rewriting history. Do not expose internal moderator notes to ordinary users.

## 4. Server-side authorization and enforcement

All operations must run in trusted Appwrite Functions or an equivalent trusted backend. The browser must never be authoritative for block state, report status, moderator role, or suspension state.

Required operations:
1. blockUser(targetNoxId) — derive caller identity from the verified session; resolve the target server-side; reject self; create idempotently.
2. unblockUser(targetUserId) — delete only a block owned by the caller.
3. listMyBlocks() — return only the caller's own blocked accounts and minimal public profile data.
4. createReport(target, reason, description) — validate target, category, content ownership/visibility, and length; derive reporter identity server-side.
5. listMyReports() — return only the reporter's own submissions and safe status updates.
6. reviewReport(reportId) — moderator-only; enforce role checks server-side.
7. applyModerationAction(targetUserId, action) — moderator-only, reason required, expiry validated, audit event written.
8. restoreAccount(targetUserId) — moderator-only, records a restoration event; never erase prior audit history.

For every direct-message, friend-request, presence, and other private interaction endpoint, check both directions of the block relationship on the server. A frontend-only hide is not enforcement. For suspended accounts, check the current server-side status on every protected operation; do not rely only on a cached client flag.

## 5. Privacy, abuse resistance, and fairness

- Keep all new tables private with row security enabled. Do not grant broad client write permissions.
- Users may read their own block list and their own report status only. They cannot read other users' reports, block lists, or moderator notes.
- Moderators receive least-privilege access based on an explicit server-verified role.
- Never trust reporterId, blockerId, actorUserId, isModerator, or status supplied by the browser.
- Rate-limit report creation and block/unblock calls without preventing urgent safety reports.
- Validate IDs and text lengths; escape user-submitted text when displayed.
- Avoid revealing whether a report was filed by a particular person.
- Define evidence retention and deletion periods before launch; delete evidence when no longer necessary, subject to documented legal requirements.
- Provide a clear appeal route for account-level restrictions and a human review path for consequential decisions.
- Keep security logs free of passwords, API keys, session tokens, and unnecessary private message content.

## 6. User experience

- Block confirmation explains which interactions will be stopped.
- Unblock is available from a private blocked-users list.
- Report confirmation explains that submission is not an automatic finding or guarantee of action.
- The reported person is not shown the reporter's identity.
- A restricted user receives a neutral explanation, duration when applicable, and appeal instructions.
- Do not reveal anti-abuse thresholds or internal detection signals in user-facing messages.

## 7. Required tests before release

- A blocked user cannot message, friend-request, or view protected presence of the blocker through direct API calls.
- The blocker's unrelated public content and other users' experiences remain unaffected.
- Neither party can bypass a block by reversing request direction or changing client IDs.
- A user cannot read, modify, or delete another user's block or report.
- A non-moderator cannot review reports or apply moderation actions by changing request payloads.
- Temporary suspensions expire server-side; permanent actions require an authorized human decision.
- Automated limits are temporary, logged, and do not independently issue permanent suspensions.
- Duplicate submissions and concurrent block calls behave idempotently.
- Report content is length-limited, safely rendered, access-controlled, and retained only as long as defined.
- Appeals and restoration actions preserve the audit trail.

## 8. Release gate

Do not enable the feature until the proposed tables, indexes, Appwrite permissions, Functions, moderator role management, retention policy, appeal process, and abuse tests are implemented and reviewed. This specification is a design document, not a deployed moderation system or independent security audit.
