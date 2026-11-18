# NOX NEXT — Non-Game Modules Engineering Readiness Review
Date: 2026-11-18
Branch: `feature/auth-login-staging`
Scope: read-only source review; documentation only. NOX KISS game files are explicitly excluded.

## Executive decision
The repository contains substantial browser UI and server-function scaffolding, but the non-game social product is not ready to be described as a live service. The current pages contain demo content and local-only interactions. The moderation Function README explicitly states that deployment and live Appwrite integration are incomplete. Continue with a gated, staged implementation plan; do not expose unfinished modules as operational.

This review is an AI engineering review, not a claim that human engineers or a live Appwrite test environment reviewed the code.

## Files and modules inspected
- `home.html`, `core/app.js`, `core/navigation.js`: main social shell, friend modal, local demo interactions and navigation.
- `membership.html`, `membership.js`: membership/frames presentation and client preview.
- `admin-wallet.html`, `wallet.html`, `wallet.js`: admin/user wallet presentation and transfer preview.
- `jewels.html`, `jewels.js`: jewel-to-NXC calculator preview.
- `functions/moderation/src/policy.js`, `functions/moderation/README.md`: validation/security policy and declared server scaffold status.
- Repository tree also contains `functions/moderation/src/index.js`, `store.js`, policy and integration tests, setup/deploy workflows, and `db/migrations/001_friends_schema.sql`; these require the separate implementation/test gates below.

## Findings by module

### 1. Main shell, navigation, and social feed
- `home.html` includes sample people, sample stories/posts, fixed notification counts, and demo action buttons. These must be visibly treated as preview data until backed by authenticated server responses.
- `core/app.js` contains local UI behavior and browser storage for friend-request preview state. Local storage must never become the authority for account identity, friendship, membership, notification state, or access.
- `core/navigation.js` currently routes several destinations to informational notices rather than working sections.
- The logout control in the inspected home markup is wired to a demo notice, not a confirmed session-close flow.
- Decision: retain the page as a visual shell only. Replace demo content with authenticated API data only after membership authorization is enforced server-side.

### 2. Friends and NOX ID
- The browser validates NOX ID syntax and can scan QR, but the UI itself warns that existence cannot be confirmed before server connection.
- Incoming/sent requests and accepted friends are stored in localStorage in the preview path. This is not authoritative and must not be reused as production state.
- The Function README describes server routes for lookup, requests, responses, cancellation, and friend listing. It also documents read-then-write duplicate-request race risk and missing persistent lookup rate limiting/anti-enumeration.
- Decision: server-owned friendship state only; rate-limit lookup, normalize IDs server-side, prevent account enumeration, check blocks in both directions, and test simultaneous duplicate requests/acceptance before release.

### 3. Private conversations and messages
- The Function README describes one-to-one conversations, participant checks, confirmed-friend requirement, bidirectional block checks, a 4,000-character message limit, 30 messages/minute sender limit, and UUID idempotency.
- It explicitly states that live deployment, Realtime delivery, pagination, edit/delete, and end-to-end UI integration are incomplete.
- Decision: no claim of live chat until schema provisioning, server deployment, two-account integration tests, retry/idempotency tests, pagination strategy, and UI connection pass. Keep browser database permissions private; all reads/writes through authenticated server routes.

### 4. Notifications
- Server routes are described for recipient-scoped list/read operations, but no verified end-to-end browser notification integration is established by the inspected pages.
- Decision: derive recipient exclusively from verified server identity; never accept recipient user IDs from the browser. Add unread count consistency, pagination, and duplicate-event tests before showing live badges.

### 5. Membership and account gate
- Existing membership/auth documentation already defines fail-closed states and a server-authoritative approval gate.
- This review reinforces that every member-only route and page-data endpoint must verify membership; hiding a menu item or redirecting in JavaScript is not authorization.
- Decision: complete auth and membership gate before activating any social modules. Pending, rejected, suspended, unknown, and malformed membership states receive no member data access.

### 6. Gifts, jewels, wallet, and NXC
- `jewels.html/js` is explicitly a local calculator preview and does not mutate balances.
- The wallet transfer page's inspected script describes a preview only; it does not execute a transfer. Recipient identity must be resolved by the server before any confirmation.
- Admin wallet UI must not imply administrative powers unless protected server authorization and immutable audit records exist.
- Decision: keep all balances and conversions non-operative previews. No real-money flows, cash-out, peer-to-peer value transfer, or real-value issuance are in scope. Any future points ledger must be server-authoritative, append-only/audited, idempotent, and concurrency-tested, with clear non-cash status.

### 7. Reports, blocks, and moderation
- `policy.js` validates report reasons/content types, blocks self-blocking, and contains moderator allowlist and bidirectional block helpers.
- The README says moderator review/action routes are intentionally 501, message/profile reports are not enabled, and API key scopes are project-wide rather than table-isolated. It also says the server persistence path has not been live-integration-tested.
- Decision: do not enable moderator actions or present a working moderation console. Define reviewer access, report retention, appeal process, evidence visibility, and least-privilege credentials before implementation. Keep credentials out of source and browser.

## Cross-cutting release blockers
1. **Authentication and membership:** server-side approval checks on every member route and protected resource.
2. **Appwrite environment:** confirm actual Function runtime, SDK compatibility, schema/table provisioning, protected variables, and least-privilege API-key strategy in a non-production environment.
3. **Integration testing:** synthetic accounts only; test unauthorized, pending, rejected, suspended, cross-user access, duplicate requests, concurrent state changes, retries, and rollback behavior.
4. **Browser integration:** replace localStorage demo state and hardcoded data with authenticated server responses; add loading/empty/error states and safe logout.
5. **Privacy and abuse prevention:** lookup rate limits, anti-enumeration, block enforcement across all contact surfaces, report access scoping, and no identity-document collection/storage in NOX.
6. **Observability:** structured safe error codes and operational logs without credentials, message bodies, report descriptions, or sensitive personal data.
7. **Accessibility and resilience:** keyboard navigation, focus management for dialogs, clear status announcements, mobile layout, network retry behavior, and session-expiry handling.

## Recommended implementation order
1. Finish browser authentication and server-authoritative membership gate.
2. Build admin membership review and audited approval/rejection/suspension flows, including scheduled bulk approval with per-account revalidation.
3. Connect profile basics and account settings, with strict field-level privacy.
4. Connect friends/NOX ID using server state, anti-enumeration, rate limits, and concurrency tests.
5. Connect notifications using recipient-scoped server endpoints.
6. Connect private conversations and text messaging, then Realtime and pagination only after baseline correctness.
7. Complete block/report enforcement and moderation operations only after governance and least-privilege review.
8. Connect feed/stories/media publishing only after upload authorization, moderation, retention, and privacy rules are specified.
9. Review wallet/jewel/gift previews as a separate non-cash ledger design; do not activate balance mutations in this stage.
10. Stop at the NOX KISS boundary. The game is reserved for joint design and implementation later.

## Acceptance gates
A module is not considered complete until:
- all member endpoints reject unauthenticated and non-approved users;
- users cannot read or mutate another user's private records by changing IDs;
- browser storage and client role/status fields are ignored by the server;
- concurrency and retry tests prove no duplicate or partial state transitions;
- blocks are enforced in both directions wherever contact is possible;
- UI states match server truth and never present demo data as real;
- tests pass in a non-production Appwrite environment using synthetic accounts;
- privacy, retention, and operational behavior are documented.

## Explicit exclusions and change control
- Do not modify `nox-kiss.html`, `nox-kiss.js`, `nox-kiss.css`, or any game design/logic until the user and assistant return to the game together.
- This commit changes documentation only. No backend code, database schema, Appwrite configuration, secrets, runtime, or deployment has been changed.
- Any future backend/schema/runtime/deployment change requires a separate explicit authorization after its impact is explained.
- No identity-card images, ID numbers, signatures, or identity-verification documents are to be uploaded to or stored in NOX based on the external in-person process described by the project owner.
