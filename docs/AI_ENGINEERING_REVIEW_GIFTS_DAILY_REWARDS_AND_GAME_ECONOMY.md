# AI Engineering Review — Gifts, Daily Claims, and Game Rewards

**Review type:** AI-assisted multidisciplinary engineering review (product, backend, security, QA, privacy, and UX perspectives).  
**Status:** Recommendations only; not a human engineering sign-off. No implementation, deployment, wallet operation, or Appwrite change is authorized.

## 1. Overall assessment

**Recommendation: Approve the product direction provisionally, but do not implement the game reward flow until the open rules below are resolved and abuse controls are designed.** The daily claim is simpler and can be specified cleanly. Administration gifts are workable with strict permissions and immutable audit history. Game-time rewards carry the highest abuse and economy-integrity risk.

NXC is treated only as a non-cash internal app unit. This review does not approve real-money deposits, withdrawals, payouts, or exchange.

## 2. Review by area

### A. Administration gifts

- **Approve — separate event type:** Keep administration gifts separate from member-to-member gifts and catalog gifts. Use distinct event types and permissions.
- **Approve with safeguards — eligibility:** Administration may gift both men and women, while the separately recorded restriction on member-sent gifts to men remains unchanged.
- **Approve — recipient history:** Show completed gifts in recipient profile history and wallet activity. Preserve the original record permanently.
- **Approve with safeguards — sender identity:** Show «إدارة NOX» to the recipient; retain the individual administrator identity only in restricted audit data.
- **Approve with safeguards — reason/note:** Require a reason for every admin gift. Freeze the note after completion; corrections must be new audited events, never edits to the original.
- **Approve — notification:** Send an in-app notification only after successful completion. No push notification; no reply action.
- **Approve with safeguards — profile sharing:** Sharing must be opt-in with preview. Exclude amount, private note, and internal metadata by default. Deleting a profile post must not delete the underlying gift record. Enforce one-time sharing server-side.
- **Approve with safeguards — access and exports:** Separate view and export permissions; audit both. Export only fields needed for the report, protect downloaded files, and avoid exposing internal administrator identifiers.
- **Needs clarification — export formats:** The consolidated document currently says Excel and PDF only, but earlier choices in the discussion were inconsistent. Confirm whether CSV is also required before implementation.
- **Change — group gift execution:** Treat a group gift as a reviewed batch with a frozen recipient snapshot, per-recipient amount, eligibility recheck at execution, per-recipient result, and a batch-level audit trail. A failure for one recipient must not silently alter the others.

### B. Daily 100 NXC claim

- **Approve — eligibility:** All users, men and women.
- **Approve — presentation:** Show the claim popup when the app opens and the user is eligible; no separate phone/push notification.
- **Approve — claim action:** Credit only after explicit «استلام». Dismissing the popup does not forfeit the claim.
- **Approve — cooldown:** A rolling 24 hours after the last successful claim is clear and avoids calendar-boundary ambiguity.
- **Required safeguards:** Server-authoritative eligibility and cooldown; atomic claim event and wallet posting; unique idempotency key; duplicate-tap/retry protection; append-only audit record; clear UI states for available, processing, claimed, and temporary failure.
- **Needs clarification — account status:** Decide whether suspended, restricted, deleted-pending, or newly registered accounts can claim. Recommended default: only active accounts in good standing; never allow suspended/restricted accounts to claim while restriction applies.
- **Approve — no push:** The latest recorded user decision explicitly chooses no separate phone notification.

### C. Game entry and play rewards

- **Approve provisionally — numbers:** 10 NXC per entry; 100 NXC per completed eligible 30-minute interval; 2,000 NXC daily cap across games. These values are arithmetically consistent (20 intervals = 10 eligible hours), but arithmetic consistency does not establish economic sustainability.
- **Change — reward eligibility:** Do not award merely because two accounts are present. Require a server-verified, supported game session with meaningful activity signals and anti-idle checks. Define game-specific signals before implementation.
- **Approve with safeguards — pause:** Pause eligible-time accumulation when fewer than two valid participants remain. Resume only after the server verifies a second valid participant. Keep the same session identity.
- **Change — session boundaries:** Discarding all accumulated time on any exit is simple but may unfairly penalize network interruptions. Define a short reconnect grace period; preserve accumulated time only for a verified reconnect to the same session during that grace period. A deliberate exit or grace-period expiry ends the session and discards incomplete interval progress.
- **Needs clarification — entry fee on reconnect:** Decide whether an accidental reconnect within the grace period is part of the same paid entry (recommended: no second fee) or a new entry (new fee). The server must distinguish reconnect from a fresh session.
- **Approve with safeguards — daily cap:** Enforce the 2,000 NXC cap server-side across all eligible games and all devices for the same account. Do not let a client reset or switch games to bypass it.
- **Needs clarification — reset timezone:** Choose one fixed platform timezone and document it. Use server timestamps and a single canonical reset boundary; do not use each device's local timezone.
- **Needs clarification — cap message:** Recommended UX: show a clear message once when the cap is reached, state that play remains available but further play-time rewards pause until reset, and avoid repeatedly interrupting the user.
- **Anti-abuse requirements:** Detect account/device/session collusion patterns, repeated farming between the same accounts, idle behavior, impossible timing, rapid session churn, duplicate requests, and multi-device concurrent sessions. Use risk flags and review rather than silently changing balances.
- **Required reliability:** Use atomic server-side posting, idempotent interval identifiers, a unique session/interval constraint, and auditable outcomes for awarded, rejected, paused, expired, and retried intervals.

## 3. Cross-cutting technical requirements

1. Never trust client clocks, client-reported play duration, or client-calculated balances.
2. Treat each claim, entry fee, reward interval, and administration gift as a uniquely identified business event.
3. Enforce wallet writes on the server only, atomically with the corresponding event record.
4. Make retries idempotent so the same event cannot post twice.
5. Keep immutable ledger/audit history; corrections must be compensating events, not deletion or silent edits.
6. Apply authorization checks on every read, export, and write; UI hiding alone is not security.
7. Add automated tests for duplicate requests, concurrent claims, simultaneous sessions, cap boundaries, partial failures, retries, reconnects, and permission denial.
8. Add observability for failed postings and suspicious reward patterns without exposing private user data in ordinary logs.

## 4. Decisions still needed from the product owner

1. Are suspended/restricted accounts excluded from the daily 100 NXC claim? Recommended: yes while restricted.
2. What is the platform reporting timezone for the game daily cap?
3. Should a short accidental disconnect reconnect to the same paid game entry without another 10 NXC fee? Recommended: yes, within a defined grace period and same session.
4. What exact grace period should apply to reconnects? This should be chosen after the game’s expected network behavior is known.
5. Should reaching the 2,000 NXC cap show a one-time message? Recommended: yes.
6. Confirm whether administration gift exports include CSV in addition to Excel and PDF.

## 5. Implementation gate

Do not implement until the above product questions are answered, the data model and transaction approach are reviewed against the exact pinned Appwrite SDK/runtime, and automated concurrency/idempotency tests are specified. Any backend or schema change requires a separate explicit approval after listing affected resources and redeployment impact.

**Final AI review verdict:** Administration gifts — conditionally approved; daily 100 NXC claim — approved with standard safeguards; game rewards — conditionally approved only after session, reconnect, timezone, and anti-abuse rules are finalized.
