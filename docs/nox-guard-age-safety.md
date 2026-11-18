# NOX NEXT — NOX GUARD and Age-Aware Safety Baseline

## Current registration product decision (approved 2026-11-18)

NOX is a general social platform for all ages. Account creation has no minimum-age threshold. Date of birth is optional, may be left blank, and must not be used to reject registration or disable an account. Registration must not request identity documents or face images solely to prove age.

This registration decision does not remove privacy, reporting, blocking, anti-abuse, moderation, or age-aware safety protections. Feature-specific protective defaults may remain where justified by the approved safety policy and applicable launch-jurisdiction requirements; they must not be converted into a hidden general age gate for account creation.

## Purpose

NOX GUARD is the platform-wide safety layer for account security, communication controls, reporting, and moderation. It is not an age-verification provider and must never claim to infer a person's age from an email address, Google sign-in, or email confirmation.

NOX NEXT is intended to be a general social product, not an adults-only product. That product intent does not waive age-related requirements that may apply in a launch jurisdiction or to a particular feature.

## Registration experience

- Keep the user-facing registration flow short: email/password or an approved OAuth provider, followed by the authentication and verification steps configured for the platform.
- Do not impose a product-wide minimum-age gate on account creation.
- Date of birth is optional; a missing date of birth must not block account creation.
- Do not request identity documents or face images from users solely to prove age during ordinary registration.
- Email verification confirms control of an email address; it is not proof of age.
- A self-declared date of birth or age checkbox is an assertion, not independently verified age.
- Before public launch, review applicable jurisdiction-specific requirements and implement proportionate safeguards without silently reinstating a general minimum-age registration rule.
- Do not create a hidden bypass, client-side override, or default-to-allow path when a required safety/eligibility check for a specific feature is unavailable.

## NOX GUARD baseline controls

### Account security
- Validate Appwrite sessions on the server for protected operations.
- Apply rate limits to sign-in, recovery, account creation, and sensitive actions.
- Use least-privilege server-side authorization; never derive roles from browser storage or form fields.
- Record security events without logging passwords, session secrets, access tokens, or unnecessary personal data.

### Social interaction
- Provide block and report controls that are available from profiles and conversations.
- Enforce blocks on the server, not only by hiding interface elements.
- Require recipient consent for friend requests and private conversation invitations.
- Add anti-spam limits and duplicate/replay protection for requests and messages.
- Do not expose precise location by default.
- Provide clear controls for profile visibility and who may contact an account.

### Moderation
- Route reports to an authorized review queue.
- Keep moderation decisions auditable with actor, action, reason code, and server timestamp.
- Provide appeal/review handling for significant account restrictions.
- Do not give reviewers administrative permissions merely because they can review reports.
- Apply documented content rules consistently, including to NOX KISS.

## Age-aware policy layer

- Keep age policy separate from the general account authentication mechanism.
- Before launch, determine the applicable age categories and requirements for each launch jurisdiction with qualified local legal/privacy review.
- Configure feature access and protective defaults server-side according to the approved policy; never rely on a client-side age label as authorization.
- Where a jurisdiction or feature requires stronger age assurance, use a proportionate, privacy-preserving method and collect only the minimum result needed.
- If a required eligibility or safety decision cannot be made, do not silently allow the restricted feature.
- Avoid collecting or retaining identity-document images, identity numbers, or face images unless a documented legal assessment establishes necessity and a compliant handling process is approved.
- Do not describe email/Google sign-in, an email confirmation, or an unchecked age declaration as age verification.
- NOX KISS is intended as a non-explicit social/entertainment experience; that description is not a substitute for content review, age-appropriate design, or platform safeguards.

## Data minimization

Prefer storing only:
- the account ID;
- the minimum age-policy state needed to apply the approved feature rules;
- policy version and consent timestamps where applicable;
- moderation/report records required to operate the service.

Set documented retention periods and access controls. Do not put identity documents or unnecessary sensitive data in ordinary profile rows, support notes, or logs.

## Implementation boundary and rollout

This document is an implementation specification, not a claim that NOX GUARD is already active.

Current repository components include Appwrite authentication client code and private NOX_CORE table bootstrap definitions. They do not yet provide a complete server-side registration workflow, role enforcement, report/block APIs, moderation queue authorization, or age-aware feature enforcement.

Roll out in this order:
1. Review the launch jurisdictions, privacy notice, terms, and age/feature policy.
2. Implement server-side authorization and rate limits.
3. Implement server-enforced block/report and moderation workflows.
4. Implement the approved age-policy decision and feature defaults server-side.
5. Add automated tests for unauthorized access, bypass attempts, rate limits, report/block enforcement, and policy failures.
6. Enable public registration only after the required controls are verified.

No database schema, Appwrite console setting, secret, runtime, or deployment is changed by this specification.
