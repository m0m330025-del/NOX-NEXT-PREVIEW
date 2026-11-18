# NOX NEXT — Authorization Matrix

This document records the approved product model. It does not implement or grant permissions.

| Account type | Standard NOX interface | Review console | Admin console |
|---|---:|---:|---:|
| User | Yes | No | No |
| Reviewer | Yes | Yes | No |
| Admin | Yes | Yes | Yes |

## Security requirements

- Roles must be assigned and returned by a trusted server-side authorization source.
- Browser storage, query parameters, HTML attributes, and client-side JavaScript must never grant roles.
- Hiding an icon is presentation only. Every protected page, record read, and decision action must be authorized server-side.
- Admin accounts carry both the review and admin permissions; the permissions remain separately auditable.
- Each review decision must record the acting reviewer, decision, reason, and server timestamp.
- Reviewer accounts receive only the minimum review permissions assigned to them.
- No reviewer or admin UI in this preview can approve accounts, change roles, or access private applicant records.
- Human review does not replace applicable legal requirements, age safeguards, or independent professional accreditation.

## NOX KISS access model

- NOX KISS has no adult-only account type, role, permission, entitlement, or separate access tier.
- NOX KISS is not assigned an adult-only (+18) classification by this authorization model.
- Users do not receive additional game permissions based on an adult designation.
- Platform-wide account safety and age-protection requirements remain separate and are not disabled by this game access model.
- The standard User / Reviewer / Admin roles above remain the only documented account roles; reviewer and admin powers are for their stated operational consoles only.

## Current implementation boundary

The review console is a static, authenticated preview. It contains no applicant data and performs no review actions. The review and admin entry points remain hidden until a trusted authorization integration is implemented. No backend, database, schema, secrets, runtime, or deployment changes are included.
