# Engineering Review Package — Gifts, Daily Claims, and Game Rewards

**Status:** Prepared for engineering review; all product decisions below remain provisional until reviewed and explicitly approved.  
**Scope:** Documentation and review only. No implementation or activation is authorized by this document.

## Important implementation boundary
- NXC/coins are conceptual internal app units only, not cash or real-world monetary value.
- No real-money top-ups, cash-outs, payouts, member cash exchange, or external monetary conversion.
- Do not issue or simulate live balances during review.
- Do not add admin balance-editing or minting controls.
- Do not modify Appwrite schemas, functions, workflows, secrets, or runtime configuration as part of this review.
- Any implementation proposal must be separately presented with its exact affected files/resources and redeployment impact for explicit approval.

## A. Administration gifts — provisionally recorded decisions

1. Administration may gift NXC to both men and women.
2. Administration gifts are distinct from member-to-member gifts. The previously recorded restriction remains: men cannot receive member-sent gifts; administration gifts are permitted for both groups.
3. Administration gifts appear in the recipient's profile gift history and wallet activity.
4. After a gift is successfully completed and credited, the recipient receives an immediate in-app notification only; no phone push notification was selected.
5. The notification is informational and read-only; the recipient cannot reply or send thanks through it.
6. The recipient-facing sender name is always **إدارة NOX**. The individual administrator's identity is retained only in restricted internal audit records.
7. The administration note/reason is visible to the recipient in gift history and the notification, if supplied.
8. Once the gift is completed and the note is sent, the note is immutable. It cannot be edited or deleted; any future correction requires a separately designed auditable amendment preserving the original.
9. The recipient may voluntarily share a post about receiving the gift on their NOX profile. Sharing is not automatic; the recipient previews and explicitly publishes it.
10. The default shared post does not disclose the NXC amount, private administration note, or internal audit metadata.
11. The recipient may delete the shared profile post at any time. Deletion does not alter the gift, wallet activity, immutable history, note, or audit record.
12. A given administration gift may be shared only once. If the post is deleted, the same gift cannot be shared again.
13. The gift-history entry itself remains visible to the recipient and cannot be hidden or deleted.
14. No rating, review, or comment feature is provided for administration gifts.
15. Administration gifts do not appear in public gift lists or public activity feeds. Visibility is limited to the recipient and authorized administration users, except for the recipient's separately initiated profile post.
16. Admin gift history supports Excel and PDF export (CSV was not selected in the user's later correction).
17. Gift history access is available to the system administrator and authorized administrative staff. View and export permissions are separate; access/export actions are auditable; historical entries are immutable.
18. A basic read-only analytics dashboard displays total completed gift NXC, number of recipients, and number of completed gifts.
19. Dashboard statistics are separated for men and women and also show overall totals.
20. Date filters: today, week, month, year, and custom date range, using a configured platform reporting timezone.
21. No month-over-month or arbitrary period comparison feature was requested; the user explicitly said the analytics scope was enough.

## B. Daily claim gift — provisionally recorded decision

1. Each eligible user sees an in-app popup offering **100 NXC** when a claim becomes available.
2. The user must press **استلام**; merely showing or dismissing the popup does not credit the reward.
3. The next claim becomes eligible 24 hours after the previous successful claim (rolling 24-hour cooldown).
4. If the popup is dismissed without claiming, the claim remains available until claimed; it does not silently expire.
5. The exact eligibility/exclusion rules and whether this daily claim is available to every account category need engineering/product confirmation.
6. A prior question about whether an additional notification is needed when the user has not opened the app was not answered. Current agreed experience is the popup when the app is opened and the user is eligible; no separate phone push was approved.
7. Server-side cooldown enforcement, idempotency, and an auditable claim event are required.

## C. Game entry and play rewards — provisionally recorded decisions

1. Game entry fee: **10 NXC per game entry**.
2. A completed 30-minute eligible play interval awards **100 NXC**.
3. Two completed eligible intervals (one eligible hour) award **200 NXC**.
4. If the user exits before completing the 30-minute interval, partial time is discarded; on a new entry the timer starts from zero.
5. Play rewards are eligible only when at least two distinct valid participants are present in the same game session. Solo play does not earn play-time rewards.
6. If the other player leaves and the session falls below two valid participants, the reward timer pauses. When another valid player joins, it resumes from the accumulated eligible time in the same session.
7. If the user exits the game, partial accumulated time is discarded.
8. Daily play reward cap: **2,000 NXC per user per day**, across all eligible games.
9. This cap equals at most 20 completed 30-minute intervals (10 hours of eligible play time) at 100 NXC per interval.
10. Reaching the cap stops additional play-time rewards until the next daily reset, but does not block access to play.
11. The daily cap resets at the platform's configured reporting timezone boundary; the timezone must be chosen before implementation.
12. Server-side verification of session participation, valid play, interval completion, duplicate prevention, and daily cap is required.
13. The user has not yet answered whether reaching the daily cap should display a message. Proposed wording in the prior question: «وصلت إلى الحد اليومي للمكافآت، استمتع باللعب وغدًا مكافآت جديدة». This remains open for review.

## D. Engineering review questions

Please review and return recommendations, risks, and any changes needed before implementation:

1. Are the daily claim and game reward rules technically enforceable without client-side trust?
2. What is the authoritative server definition of an eligible active player and valid play time? How should idle, reconnect, network interruption, app backgrounding, and participant substitution be handled?
3. Should accumulated time pause/resume only within the same game entry/session, and how should server restarts or dropped connections affect it?
4. Is the rolling 24-hour daily claim cooldown preferable to a calendar-day reset? Confirm timezone and daylight-saving behavior for daily game caps.
5. What account eligibility rules apply to daily claims and game rewards? Confirm whether both men and women are eligible.
6. Are 10 NXC entry fee, 100 NXC per 30 minutes, and 2,000 NXC daily cap internally consistent with the game's expected session design?
7. What anti-abuse controls are needed for multi-account collusion, idle farming, automated clients, and repeated session creation?
8. How should failures and retries be handled so no entry fee or reward is duplicated, lost, or posted without an auditable event?
9. Are the proposed member-facing privacy rules and administration audit permissions consistent with the platform's access-control model?
10. Are Excel/PDF exports and basic demographic/date-filtered analytics appropriate, and what data-minimization safeguards are required?
11. What exact user-facing states and messages should be shown for available, claimed, cooldown, paused, cap-reached, failed, and retry states?
12. Identify any product ambiguities or conflicts and recommend the safest, simplest resolution.

## E. Decisions still requiring user confirmation

- Daily claim eligibility across account categories.
- Whether the daily 100 NXC popup should have a separate notification when the app is not open (no phone push has been approved).
- Whether the daily game cap should show a cap-reached message.
- The platform reporting timezone for calendar-based daily cap reset.
- Precise definition of valid active gameplay and handling of temporary disconnections.
- Whether the 10 NXC game entry fee is charged on every re-entry after leaving, including accidental disconnects (current wording says per game entry).

## Review response format requested
For each issue, mark **Approve**, **Change**, or **Needs clarification**, explain the reason briefly, and list any implementation prerequisites. Do not implement or activate anything during this review.
