# NOX NEXT — Authorization Matrix

This document records the approved product model. It does not implement or grant permissions.

| Account type | Standard NOX interface | Review console | Admin console |
|---|---:|---:|---:|
| User | Yes | No | No |
| Reviewer | Yes | Yes | No |
| Admin | Yes | Yes | Yes |

## Platform account eligibility

- Minimum account age for the current NOX NEXT access proposal: 18 years.
- Applicants below 18 are not eligible to create or use an account under this proposal.
- Age eligibility must be checked before account creation by a trusted server-side process using a lawful, proportionate age-assurance method appropriate to the launch jurisdictions.
- A self-declared date of birth or a client-side checkbox alone is not sufficient proof of eligibility.
- Do not collect or retain identity documents or sensitive age-assurance data in the browser or application database unless a documented legal and privacy assessment establishes a strict need; prefer a provider that returns only an eligibility result or age band.
- If eligibility cannot be established, account creation must remain unavailable. Do not provide a manual bypass or allow client-side overrides.
- Publish clear privacy information, retention limits, an appeal/contact route, and applicable terms before enabling registration.
- The 18+ threshold here is an account-access eligibility rule, not a claim that NOX KISS contains sexual content or has an adult-content rating.
- These criteria are a project policy proposal and must be checked against applicable local laws before launch.

## Security requirements

- Roles must be assigned and returned by a trusted server-side authorization source.
- Browser storage, query parameters, HTML attributes, and client-side JavaScript must never grant roles.
- Hiding an icon is presentation only. Every protected page, record read, and decision action must be authorized server-side.
- Admin accounts carry both the review and admin permissions; the permissions remain separately auditable.
- Each review decision must record the acting reviewer, decision, reason, and server timestamp.
- Reviewer accounts receive only the minimum review permissions assigned to them.
- No reviewer or admin UI in this preview can approve accounts, change roles, or access private applicant records.
- Human review does not replace applicable legal requirements, age safeguards, or independent professional accreditation.

## NOX KISS product description and access model

- Intended product description: NOX KISS is a social and entertainment experience with a non-explicit romantic theme; it is not designed as an adults-only (+18) content space.
- This is the product's stated intended description, not a completed independent content or moderation audit.
- NOX KISS has no adult-only account type, role, permission, entitlement, or separate access tier.
- NOX KISS is not assigned an adult-content (+18) classification by this authorization model.
- Users do not receive additional game permissions based on an adult designation.
- Platform-wide account safety and age-protection requirements remain separate and are not disabled by this game access model.
- The standard User / Reviewer / Admin roles above remain the only documented account roles; reviewer and admin powers are for their stated operational consoles only.

## Current implementation boundary

The review console is a static, authenticated preview. It contains no applicant data and performs no review actions. The review and admin entry points remain hidden until a trusted authorization integration is implemented. No backend, database, schema, secrets, runtime, or deployment changes are included.
