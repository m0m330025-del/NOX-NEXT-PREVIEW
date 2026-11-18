# Registration Age Verification Channel Decision 01

- Status: User-requested product preference; provisional and subject to security/legal review.
- User preference: Applicants should send their national ID image to NOX administration through WhatsApp, not upload it inside the NOX NEXT app.
- Proposed flow:
  1. Applicant creates a pending registration in NOX NEXT.
  2. The app displays the official NOX administration WhatsApp contact and clear submission instructions.
  3. Applicant sends the required evidence through WhatsApp.
  4. An authorized administrator reviews the evidence outside the app.
  5. The administrator records only the verification outcome, reviewer identifier, timestamp, and minimal reason code in NOX NEXT.
  6. The account is activated only after the 18+ requirement is verified.
- Important limitation: This preference does not authorize collecting ID images yet. WhatsApp is not approved as a secure identity-document repository.
- Required safeguards before launch: use an organization-controlled WhatsApp Business account; restrict access to named authorized reviewers; enable strong account security; prevent unnecessary forwarding and local copies; disable unnecessary automatic media downloads and backups where possible; define and enforce a short deletion/retention period; never copy ID images or full ID numbers into NOX app logs, analytics, exports, or ordinary admin records.
- Legal/privacy gate: obtain qualified legal/privacy review for the lawful basis, user notice, data controller obligations, cross-border processing, retention, deletion, and appeal process before collecting national ID images.
- Privacy-minimizing alternative recommended by AI review: use WhatsApp only to send the applicant a secure, time-limited verification route or instructions, rather than treating WhatsApp chats as the document store. If the owner insists on direct WhatsApp submission, complete a documented risk assessment first.
- Scope: Documentation only. No WhatsApp integration, messaging, identity collection, Appwrite changes, account activation, or deployment is authorized.
