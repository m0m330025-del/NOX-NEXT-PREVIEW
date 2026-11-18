# NOX NEXT — AI Engineering Review: Registration and Age Verification

**Review type:** AI-assisted product, security, privacy, and QA review.  
**Status:** Recommended specification for owner review; not human sign-off. Documentation only. No backend, schema, workflow, or deployment changes are authorized.

## 1. Existing product decisions to preserve

1. A user submits a registration request from inside NOX NEXT.
2. There is no separate member-approval workflow.
3. Age eligibility is checked within the game/app experience.
4. The account must meet the 18+ requirement before activation.
5. The administrator personally reviews the submitted national ID evidence before activating the account.
6. The system records the review outcome and decision timestamp.
7. Do not retain the national ID image or the full national ID number.

## 2. Recommended registration lifecycle

Use the following account states:

- **Draft:** Registration started but not submitted.
- **Pending age review:** Registration submitted; account cannot access member features.
- **Approved / Active:** Age eligibility confirmed by an authorized reviewer; account can proceed to normal onboarding.
- **Rejected:** Age eligibility could not be confirmed; member access remains blocked.
- **More information required:** Evidence is unclear or incomplete; user may resubmit through the approved secure flow.
- **Suspended:** Previously active account temporarily restricted; this is distinct from a rejected registration.

Do not treat a submitted form, a claimed birth date, or a successful login as proof of age.

## 3. Recommended review workflow

1. Collect only the minimum registration details needed to create a pending account.
2. Explain why age verification is required, what evidence is reviewed, who can review it, and how long any temporary evidence is retained.
3. Present the verification step inside the app.
4. Route the case to a restricted administrative review queue.
5. The authorized reviewer checks whether the evidence establishes the 18+ requirement.
6. Store only the result (eligible / not eligible / more information required), reviewer identifier, timestamp, and a minimal reason code.
7. Delete the submitted ID image and any full ID number as soon as the review is completed, unless a separately approved legal retention requirement applies.
8. Activate the account only after an eligible result is recorded.
9. Notify the applicant of the result without exposing internal reviewer details.

## 4. Privacy and security requirements

- Never place ID images or ID numbers in ordinary logs, analytics, email notifications, or general support tickets.
- Restrict access to submitted evidence to specifically authorized reviewers; log each access.
- Use encrypted transport and protected storage for any temporary evidence.
- Set a short, documented deletion deadline for temporary evidence. Do not keep it indefinitely.
- Do not display the full ID number in the admin review list.
- Avoid collecting an ID image if a privacy-preserving age-verification provider can return a reliable age-eligibility result without sharing identity details with NOX.
- Do not use face recognition or biometric matching unless separately assessed, legally reviewed, and explicitly approved.
- Provide a safe retry/appeal path for unclear or incorrect decisions.
- Do not expose whether another account or person has submitted an ID.

## 5. Important legal and operational gate

Because national ID documents are highly sensitive and age verification rules vary by jurisdiction, obtain qualified legal/privacy review before collecting or processing ID evidence. Confirm the lawful basis, notice, data controller responsibilities, retention period, access policy, and deletion process. The system should not launch ID collection until these are documented.

## 6. QA acceptance criteria

- Pending, rejected, and more-information-required accounts cannot enter member-only features.
- Only an authorized reviewer can change a pending case outcome.
- Every decision records reviewer, timestamp, and reason code.
- Duplicate submissions and repeated review actions are idempotent and auditable.
- ID image and full ID number do not appear in logs, analytics, exports, or ordinary admin tables.
- Evidence is deleted according to the approved retention policy.
- Unauthorized reviewers cannot view or download evidence.
- A user can see a clear status and resubmission/appeal instructions.
- An account cannot become active through client-side manipulation or a forged status value.

## 7. AI engineering verdict

**Conditionally approve the workflow**, with one material privacy recommendation: prefer a privacy-preserving age-verification provider that returns only an age-eligibility result. If manual national-ID review remains required, collect the least possible evidence, tightly restrict access, and delete it promptly after review, subject to legal requirements.

**Do not implement ID collection or account activation until legal/privacy review and the evidence-retention policy are approved.** This document does not authorize Appwrite schema/function changes or deployment.
