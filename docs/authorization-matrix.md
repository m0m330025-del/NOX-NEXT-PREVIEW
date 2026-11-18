# NOX NEXT — Authorization Matrix

This document records the approved product model. It does not implement or grant permissions.

| Account type | Standard NOX interface | Review console | Admin console |
|---|---:|---:|---:|
| User | Yes | No | No |
| Reviewer | Yes | Yes | No |
| Admin | Yes | Yes | Yes |

## Platform account eligibility and age-aware access

- NOX NEXT is intended to be a general social product, not an adults-only product; this product intent does not waive age-related requirements that may apply by jurisdiction or feature.
- Do not impose a universal 18+ product classification solely because NOX KISS has a non-explicit romantic theme.
- Before public launch, document the applicable age categories and requirements for each launch jurisdiction with qualified local legal/privacy review.
- Apply any required age or feature eligibility decisions server-side. A client-side checkbox, self-declared date of birth, email address, Google sign-in, or email confirmation must not be described as independent age verification.
- Keep registration simple and avoid manual review for every ordinary user, but do not enable unrestricted public registration until required eligibility and child-safety controls are implemented and verified.
- Use proportionate, privacy-preserving age assurance only where required; do not collect or retain identity documents or face images without a documented necessity and approved compliant process.
- If a required eligibility or safety decision is unavailable, do not silently bypass the restriction.
- Publish clear privacy information, retention limits, contact/appeal routes, and applicable terms before enabling public registration.
- NOX KISS has no adult-only role or entitlement in this authorization model. Its intended non-explicit product description is not an independent content audit and does not disable platform-wide safety requirements.


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
