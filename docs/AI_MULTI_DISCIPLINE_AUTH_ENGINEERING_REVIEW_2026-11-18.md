# NOX NEXT — Multi-Discipline AI Engineering Review

**Date:** 2026-11-18  
**Branch reviewed:** `feature/auth-login-staging`  
**Review mode:** Static source review by simulated AI specialist perspectives  
**Human engineer sign-off:** Not obtained  
**Runtime/integration tests:** Not executed  
**Changes made by this review:** Documentation only

## Executive decision

**HOLD: Do not treat browser authentication as a completed or secure member login flow.**

The current branch contains a browser login UI and an Appwrite credential-session helper, but the authoritative membership approval gate is not implemented in the reviewed request path. The moderation Function verifies an Appwrite JWT and resolves the caller account, then serves several member operations without checking the caller's membership state. The login page also does not call a server-side membership-status endpoint or route users into state-specific screens.

This is a release-blocking authorization gap, not merely a missing UI feature.

## Specialist perspectives

### 1. Browser/frontend engineering

**Findings**
- `login.html` calls `createLoginSession()` and displays a success message, but does not query an authoritative membership status or navigate to a protected member area.
- The success copy says the admin approval will be checked before member pages are allowed, but that check is not present in this page.
- `signup.html` is explicitly a local preview: it does not create an Appwrite account or membership request.
- The 18+ check in `signup.html` is browser-only and can be bypassed. It must not be treated as an eligibility control.
- The login page loads Appwrite Web SDK `29.0.0` from jsDelivr; the server-side package is `node-appwrite` `31.3.0`. These are separate SDKs, but the browser SDK version and API signatures still need an explicit compatibility check and controlled pinning.
- Login imports `account` and `closeCurrentSession` without using them; logout is not wired in this page.

**Recommendations**
- Make the UI consume one server-authoritative session/status response.
- Keep all member routes and data blocked until the server returns `APPROVED`.
- Add explicit pending/rejected/suspended screens only after the server contract exists.
- Use generic credential errors, loading states, accessible focus behavior, and a real logout action.
- If an age threshold remains a product rule, validate it on trusted infrastructure; collect only the minimum necessary data and define retention before storing date of birth.

### 2. Backend and Appwrite engineering

**Findings**
- The moderation Function authenticates requests using `x-appwrite-user-jwt` and `Account.get()`, but the reviewed request handler does not load a membership row or enforce `PENDING_REVIEW`, `APPROVED`, `REJECTED`, or `SUSPENDED`.
- Member operations including friend lookup/requests, notifications, conversations, messages, reports, and blocks are reachable after credential authentication without a visible membership approval check in the handler.
- The `/moderation...` route does verify the caller against `NOX_MODERATOR_USER_IDS`, but currently returns `501 not_implemented`; this is not an implemented approval/admin workflow.
- The current `users` table bootstrap definition includes `authUserId`, `noxId`, `displayName`, `avatarFileId`, and `createdAt`; it does not define the canonical membership state, rejection reason, review metadata, or scheduled batch records.
- The bootstrap script skips an existing column by key without verifying that its type, size, or required setting matches the expected definition.
- The moderation package declares Node `>=22 <23`; the previously observed deployed Function runtime was Node 26. This compatibility mismatch must be resolved before deployment.
- The deployed Function and database configuration cannot be proven correct from source inspection alone.

**Recommendations**
- Design one trusted membership authorization service and invoke it on every member-facing endpoint before reading or mutating member data.
- Define a server-owned membership record and safe state-transition operations, with conditional updates and audit records.
- Define explicit administrator authorization separately from ordinary membership approval.
- Make schema bootstrap verify existing definitions, not merely column names; test it against an isolated database snapshot.
- Resolve Node runtime compatibility and verify exact Appwrite Cloud + SDK behavior for disabled accounts and session creation.
- Do not store a privileged Appwrite API key in browser code.

### 3. Security engineering

**Critical risks**
1. **Approval bypass risk:** an authenticated but unapproved account may reach member APIs because the reviewed Function handler does not enforce the canonical membership state.
2. **Misleading login state:** the browser can display successful login without knowing whether membership is approved.
3. **Client-only age validation:** the registration preview checks age in JavaScript only; it is not an authoritative control.
4. **Unimplemented admin workflow:** the moderation route is a 501 stub, not a secure approval endpoint.

**Required controls**
- Server-side authorization on every protected API and data operation; deny by default for missing/unknown states.
- Derive identity only from the verified Appwrite session/JWT, never from browser fields.
- Verify admin identity and permission server-side for every administrative operation.
- Rate-limit authentication, registration, and recovery at trusted infrastructure.
- Use audit records for all state transitions and scheduled batch decisions.
- Restrict browser origins, CORS, and password-recovery redirects to explicitly approved hostnames.
- Keep identity-card images, full identity numbers, and paper signatures outside the application as already decided.

### 4. QA and reliability engineering

**Findings**
- The reviewed files do not demonstrate an end-to-end login-to-approval test.
- Existing integration coverage described in the project review is limited to selected friend-request transaction behavior; it does not establish membership gate, admin approval, wallet, or scheduled-batch correctness.
- No live Appwrite integration test or browser acceptance test was run as part of this review.

**Required tests before release**
- Synthetic account for each canonical state and unknown/missing state.
- Direct page URL and direct API access checks for every state.
- Session expiry, logout, recovery, and refresh behavior.
- Client tampering attempts against state, role, NOX ID, and local storage.
- Admin authorization and audit checks.
- Conditional transition and concurrency tests.
- Scheduled batch idempotency, Cairo timezone, per-member revalidation, and skipped-member reporting.
- Rate-limit and privacy checks.

## Prioritized remediation plan

| Priority | Work item | Owner perspective | Release blocker |
|---|---|---|---|
| P0 | Implement server-authoritative membership gate on every member API | Backend/Security | Yes |
| P0 | Define membership schema and audited transition service | Backend/Data | Yes |
| P0 | Connect login UI to trusted status result; do not imply approval | Frontend | Yes |
| P1 | Implement protected admin approval/rejection endpoints | Backend/Security | Yes |
| P1 | Resolve Node 26 vs package engine mismatch | Platform | Yes |
| P1 | Verify Appwrite account/session lifecycle and browser origin configuration | Platform | Yes |
| P1 | Add synthetic end-to-end and authorization tests | QA | Yes |
| P2 | Complete responsive state screens and accessibility polish | Frontend/QA | Before launch |
| P2 | Implement scheduled bulk approval only after single-member transition safety | Backend/QA | Before bulk approval launch |

## Safe implementation sequence

1. Confirm Appwrite SDK/runtime behavior and deployment topology.
2. Propose schema changes and migration/rollback plan.
3. Implement and test the server-side membership gate first.
4. Implement audited individual approval/rejection endpoints.
5. Connect browser login and status screens to those trusted endpoints.
6. Add scheduled bulk approval only after concurrency/idempotency tests pass.
7. Run synthetic staging tests and obtain human engineering review before release.

## Scope and approval boundary

This review did not change application source, database schema, Appwrite settings, Function code, environment variables, secrets, accounts, or deployment.

Any backend/schema/Function/runtime/secret change may cause a Function redeployment. Obtain separate explicit authorization after presenting the exact proposed files/settings and deployment impact. Keep all verification synthetic until the isolated staging flow is approved.

## Final verdict

The browser credential-session helper is a useful starting point, but **NOX NEXT login is not yet a complete member authentication-and-approval system**. The next engineering task should be the server-side membership gate and authoritative state storage—not cosmetic login UI changes and not production deployment.
