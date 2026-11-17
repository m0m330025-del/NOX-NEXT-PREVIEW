# NOX NEXT — Engineering Review: Wallet & Original Platform Requirements

**Status:** Draft for engineering review  
**Scope:** Consolidates the original NOX NEXT requirements supplied by the product owner.  
**Important:** This is an AI-assisted engineering review document committed for the project team to inspect. It is not evidence that a human engineering team has reviewed or approved the design.

## 1. Product baseline

NOX NEXT is a unified Arabic-first (RTL) social and entertainment application. A single user account and NOX ID are shared across its modules. The wallet is centralized: modules must not create independent balances.

Original product areas to account for in the product/admin design:

- NOX CHAT: conversations, friend discovery by NOX ID, private and public chat, profile photos, and calls.
- SOCIAL: profiles and status/story publishing.
- GAMES / ROOMS: shared rooms, room membership, game experiences, and room moderation.
- GIFTS: a catalog of 50 gifts, including the rose at 100 NXC, usable from chat, games, statuses, and Reels.
- REELS and LIVE: short-form video and live experiences.
- MUSIC in NOX KISS rooms: Spotify search, a shared now-playing item and queue, attribution of who queued a track, and the agreed limit of one song selection per member every 15 minutes. Spotify playback/licensing and API capabilities must be validated separately before implementation.

## 2. Original wallet requirements

### 2.1 Currency and pricing

- Wallet currency: **NXC**.
- Original purchase reference: **10,000 NXC = EGP 50**.
- The application has one central wallet per user account / NOX ID.
- The wallet covers balance, purchases, transfers, gifts, rewards, and game expenses.
- No module may maintain a separate spendable balance.

The EGP 50 / 10,000 NXC value is the original purchase reference. **There is no user cash-out or NXC-to-EGP withdrawal feature.** Users purchase NXC for use inside NOX. The application owner alone receives the real-money proceeds from approved NXC sales through the payment provider. NXC is an in-app currency, not a user cash balance.

### 2.2 Top-ups / purchases

- NXC must be credited only after the payment provider confirms a successful payment through a trusted server-to-server event.
- Every payment and resulting credit must have a unique reference.
- Duplicate callbacks, retries, replayed events, cancelled payments, and failed payments must not create duplicate credits.
- The client must never be able to directly set or increase a wallet balance.
- The system needs payment reconciliation and a way to investigate unmatched provider payments.

### 2.3 Transfers between users

Transfers are initiated using the recipient's **NOX ID**.

Required flow:
1. Resolve the NOX ID on the server and show enough recipient identity for the sender to confirm the intended recipient.
2. Validate sender and recipient accounts, wallet status, amount, and available balance.
3. Reject self-transfers, invalid recipients, insufficient funds, blocked/restricted accounts where policy requires, and duplicate requests.
4. Debit the sender and credit the recipient atomically in one database transaction.
5. Generate one unique transaction reference.
6. Notify both parties and record the event in the immutable audit/ledger history.

A transfer must never leave the system in a state where only one side has been applied.

### 2.4 Gifts

- The original catalog requirement is **50 gifts**.
- The first named gift is a **rose costing 100 NXC**.
- Gifts can be sent from chat, games, statuses, and Reels.
- Before sending, the server validates the catalog item, price, sender's available balance, recipient/context, and request idempotency.
- A successful gift must debit the sender and create the gift event atomically; the event must identify sender, recipient, gift, NXC amount, source module, timestamp, and transaction reference.
- Failed gift sends must not debit the wallet.

**Still undecided:** gift revenue sharing / recipient earnings percentages, platform commission, and reversals/refunds. Unless the product owner explicitly approves otherwise, gifts are in-app items and do not create a withdrawable user cash balance. Do not invent percentages in code or admin settings.

### 2.5 Rewards and eligibility classes

The original requirements distinguish between an eligible balance and a transferable balance in the context of upgrades/levels. Engineering must model these as explicit balance categories or ledger classifications, with documented rules for:
- how rewards are earned;
- which balance category receives them;
- when and whether they become transferable;
- expiration or reversal, if any;
- how upgrades affect eligibility.

Do not silently merge promotional/reward credits with purchased credits.

### 2.6 Owner balance

The original concept included an owner balance displayed as **∞**. Engineering recommendation: treat this strictly as a presentation/administrative concept, not as a literal unlimited financial balance and not as a normal user wallet. Any owner-funded test or promotional issuance must be represented by an explicit, permissioned, auditable ledger event with a defined source and reason.

### 2.7 No user withdrawals

There is **no user withdrawal, payout, or NXC-to-EGP conversion**. Users cannot cash out NXC or transfer NXC to a bank account or mobile wallet. The application owner alone receives the real-money proceeds from NXC purchases through the approved payment provider. The customer UI and admin console must not display a user cash-out feature.



## 3A. Account upgrades, membership levels, and profile frames

The original product requirements define account upgrades by **eligible NXC balance, account gender, and account level**. Engineering must preserve this as a distinct progression system, not silently equate it with the spendable or transferable wallet balance.

### 3A.1 Male account thresholds

| Membership level | Eligible balance threshold |
|---|---:|
| Silver | 50,000 NXC |
| Gold | 500,000 NXC |
| Premium | 5,000,000 NXC |
| Premium Gold | 500,000,000 NXC |
| Premium Black | Top tier; no numeric ceiling specified |

### 3A.2 Female account thresholds

The original requirements explicitly specify:
- Silver: 50,000 NXC
- Gold: 500,000 NXC
- Higher female tiers: a previously supplied tier table exists but its exact thresholds are not present in the currently available project record. Engineering must leave these values configurable/unpublished until the product owner supplies the exact table. Do not assume the male thresholds apply.

### 3A.3 Upgrade experience

The user app should show:
- current membership level;
- next level and its threshold;
- eligible balance counted toward progression;
- remaining eligible NXC needed for the next level;
- progress indicator;
- frame preview and activation/selection;
- available static and animated frames;
- upgrade history with timestamps and prior/current level.

The progression service must define precisely which ledger events count toward eligible balance, whether spending or transfers affect eligibility, how reversals/refunds affect it, and how level downgrades or permanent attainment work. These rules are product decisions and must not be guessed.

### 3A.4 Frames and identity

- Each membership level can have its associated profile frame.
- Support static and animated frame assets.
- Let users preview a frame before activating it and select from frames they have unlocked.
- Display the selected frame around the user's profile photo/avatar.
- Keep the membership level and selected frame visible on the profile.
- Apply the selected frame consistently in chat, statuses/stories, Reels, and games/rooms where the user identity is shown.
- The admin console needs frame catalog management: create/edit, upload asset, assign level/unlock rule, set static/animated type, preview, enable/disable, ordering, and audit history.
- Frame activation must be validated server-side against the user's unlocked entitlement; client-side flags cannot unlock paid/progression frames.

### 3A.5 Separate Reels levels

The original requirements define a separate Reels visibility tier system:

| Reels level | Eligible balance threshold |
|---|---:|
| Normal | 0 |
| Silver | 50,000 NXC |
| Gold | 500,000 NXC |
| Premium | 500,000,000 NXC |

The stated visibility rule is that higher Reels levels can view content from lower levels. The product owner must confirm the complete visibility matrix, including whether lower levels can view higher-level content and whether any privacy settings override tier visibility. Do not infer the reverse rule.

### 3A.6 Admin controls for upgrades and frames

Add dedicated admin sections for:
1. Membership tier definitions and thresholds, segmented by the applicable account gender.
2. Eligible-balance calculation policy and ledger event inclusion/exclusion rules.
3. Reels tier thresholds and visibility matrix.
4. Frame catalog, assets, animation metadata, and tier mapping.
5. User progression lookup, current/next tier, and progression history.
6. Manual entitlement correction only through a reason-required, permissioned, audited action; no direct balance editing.
7. Preview/staging controls so tier and frame changes can be tested before publication.

All tier/threshold changes must be versioned and audited. Historical user progression must remain explainable after configuration changes.

## 3. Recommended wallet architecture

### 3.1 Ledger-first accounting

Use an append-only, double-entry ledger as the source of truth. Do not treat a mutable balance field as the financial record.

Each transaction should have:
- unique transaction ID and idempotency key;
- transaction type (top-up, transfer, gift, reward, game spend, reversal, admin adjustment);
- status and timestamps;
- currency and integer NXC amount (avoid floating-point arithmetic);
- source and destination wallet/account references;
- source module and business reference;
- actor / initiating user or system;
- reason and metadata;
- links to the original transaction for refunds/reversals.

A cached balance may be maintained for fast reads, but it must be reproducible from the ledger and updated in the same transaction.

### 3.2 Atomicity and idempotency

- Use database transactions for every multi-entry movement.
- Enforce unique idempotency keys and unique provider event IDs.
- Lock or otherwise serialize concurrent debits against the same wallet.
- Reject zero, negative, malformed, overflow, and unsupported precision amounts.
- Use explicit transaction states and safe retry behavior.
- Never edit or delete a completed ledger entry; correct mistakes with linked compensating entries.

### 3.3 Admin wallet controls

The administration console should include:
- wallet lookup by NOX ID / user ID;
- balance summary separated by balance class;
- searchable transaction history and transaction detail;
- top-up/payment status and reconciliation view;
- gift and game spending reports;
- suspicious activity flags and wallet freeze/unfreeze controls;
- reversal/refund workflow with linked references;
- manual adjustment only through a restricted, reason-required, audited workflow; high-risk adjustments should require a second approver;
- configurable limits and pricing only through versioned, audited settings;
- exportable operational reports with access controls.

Admin users must not directly edit a user's balance. Every exceptional adjustment must create ledger entries and an audit record.

### 3.4 User wallet screens

The customer app should provide:
- available balance and clearly separated reward/eligible balance where applicable;
- NXC purchase/top-up flow;
- transfer by NOX ID with recipient confirmation;
- transaction history with filters and details;
- gift catalog and confirmation before sending;
- clear pending / completed / failed states;
- accessible receipts/reference IDs and support/report path.

Do not expose unfinished actions as successful or functional.

## 4. Administration console — wallet-related sections

Recommended navigation:
1. Wallet overview and operational metrics.
2. User wallet search and wallet details.
3. Transactions and ledger explorer.
4. Top-ups and payment reconciliation.
5. Transfers monitoring.
6. Gifts catalog (50 items), pricing and availability.
7. Rewards and balance eligibility rules.
8. Game expenses and module-level spending reports.
9. Refunds, reversals and disputes.
10. Risk controls, limits, freezes and review queue.
11. Admin adjustments and dual approval.
12. Audit log and financial exports.
13. Wallet configuration with version history.

Other administration areas from the original NOX scope should remain visible as separate modules: users, rooms, moderation/reports, support, music queue, Reels/Live operations, staff roles, application settings, and platform analytics.

## 5. Key engineering and product decisions still required

These are blockers or explicit decisions, not values to guess:

| Topic | Current state | Required decision |
|---|---|---|
| NXC purchase price | 10,000 NXC / EGP 50 | Confirm whether fixed, promotional, or configurable and how fees/taxes are displayed |
| Payment provider | Not selected in this spec | Select provider and verify server-side confirmation/webhook security |
| Gift catalog | 50 gifts; rose = 100 NXC | Define remaining gift names, prices, availability, and media |
| Gift revenue sharing | Not specified | Define recipient/platform split, or confirm gifts are non-earning |
| Reward eligibility | Eligible vs transferable balance mentioned | Define earning and release rules |
| Game expenses | Included in central wallet | Define allowed spend types, limits, refund rules |
| Owner ∞ display | Concept only | Confirm display-only treatment; never represent as a real unlimited balance |
| User cash-out | Explicitly excluded | No withdrawal or NXC-to-EGP conversion for users; only the owner receives NXC sale proceeds |
| Refunds / chargebacks | Not fully specified | Define reversal, negative-balance, and fraud policy |
| Limits and fees | Not specified | Define per-transaction/daily limits, fees, and escalation rules |
| Spotify | Shared queue and one song / member / 15 minutes | Validate API, playback rights, regional availability, and enforcement approach |

## 6. Security, privacy, and operational requirements

- All wallet writes happen server-side; never trust client-supplied balances, prices, recipient IDs, or payment status.
- Authenticate every request and authorize every action by role and ownership.
- Apply rate limits, abuse detection, replay protection, and idempotency.
- Keep an immutable audit trail for financial and administrative actions.
- Minimize stored personal/payment data; use the payment provider's tokenized references rather than storing card details.
- Separate test and production environments and credentials.
- Monitor ledger/balance mismatches, webhook failures, queue backlogs, and abnormal spending.
- Provide backup, recovery, reconciliation, incident response, and retention policies.
- Test concurrency, duplicate events, partial failures, reversals, permission boundaries, and account restrictions before launch.

## 7. Suggested delivery phases

**Phase 0 — Product and compliance decisions:** settle open questions above; select payment provider; confirm NXC purchase terms and the owner-only receipt of NXC sale proceeds. User cash-out is excluded.

**Phase 1 — Wallet foundation:** ledger schema, wallet accounts, idempotency, atomic transfers, audit log, and automated tests. Use test credits only.

**Phase 2 — User experience:** wallet screens, NOX ID transfer confirmation, transaction history, and gift catalog in a clearly labeled test environment.

**Phase 3 — Module integration:** chat, games, statuses, Reels, and rewards all call the same wallet service; no module-specific balance stores.

**Phase 4 — Payments:** integrate provider test mode, signed webhook verification, reconciliation, refunds, and operational monitoring. Production activation only after review and approval.

**No cash-out phase:** user withdrawals and NXC-to-cash conversion are not part of NOX.

## 8. Required review outcome

Engineering review should return:
1. Proposed data model and transaction boundaries.
2. Threat model and abuse cases.
3. Payment-provider integration plan.
4. Admin permission matrix and dual-control policy.
5. Test plan covering concurrency, idempotency, retries, refunds, and reconciliation.
6. A list of product decisions required before implementation.
7. A phased estimate and dependencies.

**No financial functionality should be described as live until the backend, payment integration, security tests, and operational controls have been implemented and verified.**
