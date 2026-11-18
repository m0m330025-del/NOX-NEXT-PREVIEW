# NOX Friends UI/API Engineering Review

Branch: `feature/moderation-functions-scaffold`

## Findings
- The backend friend lookup, request, accept/decline, cancellation, and friendship routes are scaffolded.
- The current `core/app.js` friends UI still stores demo requests and accepted friends in localStorage; it is not connected to authenticated backend operations.
- The NOX ID preview result is currently based only on client-side format validation. The backend lookup route can return a real public profile, but the UI must display server results and handle errors.
- The QR scan and personal QR are preview features; personal ID currently falls back to a demo value. Production must obtain the ID from authenticated profile data.
- The friend modal needs loading, empty, error, disabled-button, and success states; preserve the existing theme and RTL/mobile layout.
- Integration requires a short-lived JWT from a real authenticated Appwrite session. Never persist JWT in localStorage or expose API keys in browser code.
- Keep interactions consent-based: users can review and accept/decline requests; blocking/reporting remain available and server enforced.

## Runtime compatibility
- Updated moderation package Node engine range to `>=22 <27` to include the configured Node 26 runtime and avoid the prior `>=22 <23` mismatch.

## Next implementation steps
1. Verify session/auth integration and eligibility gates server-side before enabling real friend interactions.
2. Connect lookup, send, incoming/outgoing request lists, response/cancel, and friendship list using the API adapter.
3. Replace fake friend-list entries with server-backed render once authenticated; show a preview state only when unauthenticated.
4. Add keyboard focus handling, modal focus return, escape/backdrop close, accessible feedback, and responsive review.
5. Run unit and integration tests; live UI testing requires synthetic test accounts and is not claimed here.
