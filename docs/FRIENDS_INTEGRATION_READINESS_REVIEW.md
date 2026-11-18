# NOX Friends Integration Readiness Review

Branch: `feature/moderation-functions-scaffold`

## Confirmed current state
- The root `app.js` initializes navigation/theme and `core/app.js`; there is no active Appwrite session integration in the inspected entry point.
- `login.html` is a preview form and does not authenticate. It explicitly prevents submission.
- `signup.html` performs a browser-side age calculation only; this is not an authoritative eligibility check.
- The friend modal in `core/app.js` uses localStorage demo request/acceptance lists and a fallback/demo NOX ID.
- `core/api.js` is an adapter requiring a short-lived JWT and does not itself obtain or validate a session.
- The moderation function verifies the supplied JWT with Appwrite Account.get() before processing requests.
- Server-side route handlers exist for lookup, friend requests, requests responses/cancellation, friends, conversations, messages, reports, and blocks.

## Readiness blockers
1. No confirmed browser SDK auth/session lifecycle or account eligibility gate in the current frontend.
2. No verified production profile-to-NOX-ID mapping/session data source for this UI.
3. No end-to-end authenticated UI test accounts or proof of a real live UI flow.
4. The local demo friends panel must not be mistaken for real server data.

## Recommended safe implementation sequence
1. Implement and test server-enforced account eligibility and appropriate safety controls before enabling live social features.
2. Integrate session handling with a supported Appwrite client SDK; never persist JWTs in localStorage or expose server keys.
3. Obtain NOX ID from authenticated profile data; remove demo ID fallbacks from live mode.
4. Connect the friends interface only after auth and eligibility gates are verified.
5. Add accessible loading/error/success states, modal focus management, keyboard behavior, and mobile layout testing.
6. Test with synthetic accounts in a dedicated test environment; do not claim live validation without evidence.

## Design review
Keep the existing RTL/violet theme. Improve consistency of loading, disabled, error and success button states; ensure camera permissions are optional and manually entered ID remains available; avoid displaying demo users as real friends.
