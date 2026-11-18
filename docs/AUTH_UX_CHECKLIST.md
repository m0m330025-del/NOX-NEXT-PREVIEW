# NOX Authentication UX and Implementation Checklist

Branch: `feature/moderation-functions-scaffold`
Status: review checklist, not an implementation or deployment.

## Login screen UX
- Keep existing Arabic RTL layout, Cairo typography, and brand panel.
- Change button text from "دخول للمعاينة" to "تسجيل الدخول" only after real authentication is implemented and tested; otherwise retain clear preview messaging.
- Loading state: disable submit and show a concise progress message.
- Errors: generic authentication error; don't reveal account existence.
- Password visibility toggle must retain accessible label and keyboard support.
- Recovery link must not pretend recovery is available before configuration.

## Registration UX
- Keep required fields minimal; validate password confirmation and format client-side for convenience only.
- Eligibility and account approval are server-side requirements, not browser checks.
- Never send identity-document images, ID numbers, or signatures to this app in the planned approval flow.
- Show a clear pending state after registration only when the server confirms it.
- Never assign or display a NOX ID before the backend confirms profile creation.

## Protected-page requirements
- Recheck active session and server-side eligibility/approval on page load.
- Deny member-area access for unauthenticated, pending, rejected, disabled, or suspended states.
- Sign-out clears the current server session.
- Handle expired sessions and API errors without exposing sensitive server details.

## Testing
- Synthetic accounts only, with no real passwords or personal documents.
- Test registration, login, logout, recovery, refresh, expiry, approval states, mobile layout, keyboard navigation, and generic error behavior.
- Do not claim live authentication is working until a successful end-to-end test is recorded.

## Design-review notes
The current screens have a consistent split-panel design and RTL structure. Avoid unnecessary redesign. Add explicit progress, error, success, and disabled states; test narrow-screen layout and focus order.
