# AI Engineering Decision Addendum — Consolidated Open Questions

**Review type:** AI-assisted engineering decision across product, backend, security, QA, privacy, and UX perspectives.  
**Status:** Recommended defaults selected by the AI review. These are recommendations for the project owner to adopt; they are not human-engineer approval. Documentation only. No implementation, deployment, wallet operation, or Appwrite change is authorized.

## 1. Decisions resolved by the AI review

1. **Game reconnect grace period — KEEP FIXED AT 5 MINUTES.** Do not expose this as an admin setting in the first release. A fixed value is easier to test, explain, monitor, and protect against inconsistent configuration. Revisit only if production evidence demonstrates a need.
2. **Daily claim eligibility — ALL GENDERS, ACTIVE ACCOUNTS ONLY.** The daily 100 NXC claim applies to men and women. Suspended accounts cannot claim while suspended. Also exclude accounts under an active security restriction that explicitly disables rewards. A restriction must have a reason, start/end or review state, and audit record.
3. **Game reward eligibility — ALL GENDERS, ACTIVE ACCOUNTS ONLY.** Gender must not affect play-time reward eligibility. Suspended or reward-restricted accounts do not earn rewards while the restriction applies.
4. **Daily claim notification — IN-APP POPUP ONLY.** No separate phone/push notification. The claim remains available until successfully claimed.
5. **Daily claim cooldown — ROLLING 24 HOURS.** The next claim becomes available 24 hours after the last successful claim, enforced by server time.
6. **Game reward cap — 2,000 NXC PER ACCOUNT PER CAIRO CALENDAR DAY.** Use IANA timezone `Africa/Cairo`; server time is authoritative. Device timezone must not affect the cap.
7. **Cap-reached message — SHOW ONCE PER ACCOUNT PER DAILY PERIOD.** Use the wording already recorded in `GAME_DAILY_REWARD_CAP_MESSAGE_DECISION_01.md`. Playing remains available; further play-time rewards stop until reset.
8. **Unexpected disconnect — 5-MINUTE SAME-SESSION RECONNECT.** Preserve already accumulated eligible time; do not count disconnected time. A verified reconnect within the grace period does not charge a second 10 NXC entry fee. After expiry, close that participation and discard incomplete interval progress.
9. **Deliberate exit / fresh entry — NEW ENTRY.** Charge the 10 NXC entry fee for a genuinely new game entry. Do not treat a deliberate exit followed by a fresh session as a reconnect.
10. **Administration gift export formats — EXCEL, PDF, AND CSV.** This is the most useful operational set: Excel for analysis, PDF for fixed reports, CSV for interoperability. Apply the same permission checks and audit logging to all formats. This resolves the earlier inconsistent discussion in favor of the broadest useful set.
11. **Group administration gifts — BATCH REVIEW AND PER-RECIPIENT POSTING.** Freeze a recipient snapshot and each recipient's amount at confirmation; recheck eligibility at execution. Record each recipient outcome separately under one batch ID. A failed recipient must not cause silent changes to other recipients.
12. **Analytics timezone — AFRICA/CAIRO.** Use the same configured reporting timezone for date filters and daily game cap reporting, with server-side date boundaries.

## 2. Server definition of valid game participation

Use a server-controlled session state machine. A participant is reward-eligible only while all of the following are true:

- The account is active and not reward-restricted.
- The participant is authenticated and bound to the current game session.
- At least two distinct eligible accounts are concurrently present in the same session.
- The server receives expected session heartbeats and game-specific activity signals.
- The participant is not marked idle, disconnected, or background-ineligible under the game's documented rules.
- The session has not ended, expired, or been invalidated.

**Do not** pay solely for elapsed wall-clock time, an open screen, or a client assertion that the player is active. Define game-specific meaningful activity before implementation; do not invent a generic movement/click threshold that could reward meaningless automation.

## 3. Session, timer, and reward posting rules

- Accumulate eligible time only while the server confirms all eligibility conditions.
- Pause the timer immediately when the session falls below two valid participants or required activity/heartbeat checks fail.
- Resume only after the server verifies eligibility again in the same session.
- Award 100 NXC only for a completed 30-minute eligible interval.
- Give every session and interval a unique immutable identifier.
- Enforce the 2,000 NXC daily cap across all games and devices for the account.
- Use atomic server-side event and ledger posting with idempotency. Duplicate requests must not duplicate a fee or reward.
- A server restart must not reset or duplicate progress; recover state from persisted server records.
- For temporary network interruption, use the recorded five-minute reconnect grace period. Disconnected time never counts as play time.

## 4. Security, privacy, and QA controls

- Never trust client clock, client-calculated balance, or client-reported play duration.
- Prevent concurrent duplicate sessions where required by game rules; detect multi-account collusion, repeated farming pairs, idle farming, automated clients, rapid session churn, and impossible timing.
- Prefer risk flags, rate limits, and auditable review over silent balance adjustments.
- Keep immutable ledger and event history. Correct errors with separately audited compensating events.
- Enforce authorization on every API, history view, analytics query, and export; hiding a button is not access control.
- Minimize exported personal data. Exclude private notes and internal administrator identifiers unless a specific authorized audit export requires them.
- Test duplicate taps, concurrent claims, concurrent sessions, cap boundary conditions, timezone changes, Cairo daylight-saving transitions, reconnect expiry, process restart, partial failure, retries, and unauthorized access.

## 5. Final AI review verdict

- **Administration gifts:** Conditionally approved, subject to batch safeguards, immutable records, and separate view/export permissions.
- **Daily 100 NXC claim:** Approved with server-authoritative rolling cooldown, active-account eligibility, idempotency, and the user's selected in-app-only presentation.
- **Game entry and rewards:** Conditionally approved only after game-specific activity signals and server state transitions are defined and tested.
- **Five-minute reconnect grace:** Keep fixed for the first release; do not add an admin control now.
- **Exports:** Excel + PDF + CSV.
- **Implementation gate:** All decisions remain documentation-level until the project owner explicitly approves a separate implementation plan with affected files/resources and redeployment impact.

**Important:** This document is an AI-generated engineering recommendation, not a report from human engineers. It must not be represented as external expert sign-off.
