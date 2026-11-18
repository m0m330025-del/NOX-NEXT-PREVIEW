# NOX NEXT — Approved All-Ages Registration Decision
**Date:** 2026-11-18  
**Status:** Approved product decision; implementation scope for the registration experience.

## Decision
- NOX is a general social platform intended for users of all ages.
- There is no minimum-age threshold for creating a NOX account.
- Date of birth is optional. A user may leave it blank.
- Date of birth must not be used as a registration rejection rule or as a reason to disable an account.
- NOX registration must not request an identity card, national ID image, face image, or other document solely to prove age.

## Safeguards retained
- Keep privacy controls, reporting, blocking, anti-abuse controls, and content moderation.
- Keep age-aware safety defaults and any feature-specific protections required by the approved safety policy and applicable launch-jurisdiction requirements. These controls must not silently become a general minimum-age gate for account creation.
- Do not infer or claim a user's age from email verification or authentication.
- Do not collect or retain optional birth-date data unless the user chooses to provide it and the purpose, access, and retention are documented.

## UI requirements
- Label the date-of-birth field as optional and do not add the HTML `required` attribute.
- Do not show an 18+ requirement, age eligibility rejection, or age-proof upload step in the registration flow.
- Explain that leaving the field blank does not prevent registration.
- Do not claim that registration is live while the page remains a preview.

## Scope boundary
This decision changes registration eligibility messaging and optionality only. It does not authorize a production launch, disable safety/moderation controls, change Appwrite configuration, change database schemas, or deploy backend Functions. Any legal obligations in a launch jurisdiction must be reviewed by qualified counsel without inventing a new product-wide age threshold.
