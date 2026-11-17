# NOX NEXT — User Support & Safety Request Screen

## Status
Frontend design specification only. This screen is for ordinary help, technical support, and safety reports. It does not request identity documents, verify age, approve access, or unlock restricted areas.

## Entry point
Add a **المساعدة والدعم** item to the account/help menu. Keep it available from the general app shell.

## Screen layout (mobile-first)

### Header
- Title: المساعدة والدعم
- Subtitle: نقدر نساعدك في مشكلة تقنية أو بلاغ متعلق بالأمان.
- Back navigation to the previous general app screen.

### Request type
Use a required single-choice field:
- مشكلة تقنية
- الإبلاغ عن إساءة أو محتوى
- مشكلة في الحساب
- اقتراح أو استفسار

### Message
- Required multiline description.
- Maximum 2,000 characters.
- Show a live character counter.
- Tell users not to include passwords, verification codes, payment details, or identity-document numbers.

### Optional reference
- Optional NOX request/reference number for an existing issue.
- Do not ask users to enter another person's private account details.

### Submit state
Before a backend exists, the screen must clearly say:
**نموذج تجريبي — لم يتم إرسال طلبك أو حفظه.**
Do not show a success state or generate a fake request number.

After a trusted backend is implemented, show a confirmation only after the server confirms persistence. The server generates the request number.

## My requests screen
Show only requests owned by the signed-in user:
- Request number
- Category
- Created date
- Current status
- Last response

Statuses:
- جديد
- قيد المراجعة
- نحتاج معلومات إضافية
- تم الحل
- مغلق

Users may add a follow-up message only while the request is open. They cannot edit staff notes or status.

## Accessibility and UX
- Full keyboard navigation and visible focus.
- Labels remain visible; do not rely on placeholders alone.
- Clear inline validation in Arabic.
- Confirmation dialog before discarding a non-empty draft.
- Responsive layout for narrow phones and desktop.

## Security requirements for later backend integration
- Derive the user identity from a validated server session.
- Enforce request ownership on every read and write.
- Validate category and message length server-side.
- Rate-limit submissions and prevent duplicate spam.
- Escape user-provided text when rendering it.
- Keep staff notes and internal audit events private.
- Never store passwords, one-time codes, identity-document images, or full identity-document numbers.

## Out of scope
This feature is not an age-verification workflow, manual identity review, membership approval, or a mechanism for entering age-restricted areas. Do not add an unlock button or an approval status that grants such access.
