# NOX NEXT — Consolidated Wallet, Gifts & Jewels Engineering Review

**Review date:** 2026-11-18  
**Review type:** AI-assisted cross-discipline document review (product, backend, data/accounting, security, QA, and UX).  
**Status:** Review findings only. No implementation, deployment, schema migration, or live transaction test performed.  
**Branch reviewed:** `feature/moderation-functions-scaffold`

## 1. Executive decision

**NO-GO for backend implementation or production activation at this time.**  
**GO for continued product specification and static UI work only**, provided previews remain clearly disconnected and do not show invented balances, successful transactions, or real-money actions.

The reviewed documents establish useful principles: session-derived identity, server-authoritative gift prices, immutable journals, idempotency, separate NXC and JEWEL accounting, no ordinary cancellation of completed gifts, and atomic posting requirements.

However, the design is not yet implementation-ready. Important accounting policy, eligibility, schema, runtime, and test evidence gaps remain. The existing Appwrite transaction test is not proof of wallet/gift/jewel correctness.

## 2. Scope reviewed

- `NXC_WALLET_API_CONTRACT.md`
- `WALLET_GIFTS_JEWELS_SCHEMA_BLUEPRINT.md`
- `NXC_TRANSFER_STATE_MACHINE_AND_FAILURE_MATRIX.md`
- `GIFT_POSTING_AND_JEWEL_REWARD_LIFECYCLE.md`
- `WALLET_UI_DESIGN_APPROVAL.md`
- `WALLET_UI_MULTIDISCIPLINARY_DESIGN_REVIEW.md`
- `WALLET_POST_APPROVAL_ENGINEERING_READINESS.md`
- `LEDGER_INVARIANTS_AND_POSTING_RULES.md`
- `WALLET_JEWELS_INTEGRATION_TEST_SPEC.md`

The review checks consistency and completeness of written proposals. It does not certify code or Appwrite behavior.

## 3. Findings by severity

### BLOCKER — Must resolve before any backend wallet/gift/jewel implementation

**B-01 — Accounting source and balancing accounts are not approved.**  
The documents refer to platform clearing, issuance, gift-consumption, reward-issuance, and conversion-clearing accounts, but the actual ownership, posting rules, and reconciliation model are undecided. A journal cannot be considered production-ready until each operation balances within its own unit and every balancing account has an explicitly approved purpose. Do not invent revenue shares, fees, or recipient credits.

**B-02 — Jewel-to-NXC conversion has an unresolved issuance authorization.**  
The 2 JEWEL = 1 NXC rule is recorded, but the source of the NXC credit and its authorization/reconciliation are not finalized. Keep conversion disabled until the NXC-side issuance/clearing policy is approved and independently reconciled.

**B-03 — Appwrite transaction and SDK behavior are unproven for this workload.**  
The documents correctly note that platform documentation is not live verification. Exact `node-appwrite@31.3.0` method signatures, multi-table atomicity, conflict behavior, bigint serialization, and safe numeric bounds remain untested in an isolated project.

**B-04 — Runtime mismatch remains open.**  
The root package allows Node 22–26, while the function package declares Node 22 only and the Appwrite Function was previously identified as Node 26. Align the declared and deployed runtime before backend implementation.

**B-05 — Real-value functionality must remain out of scope.**  
No real-money top-up, cash-out, member cash marketplace, payout, escrow, or cash-equivalent exchange should be implemented or enabled as part of this project work. Keep NXC/jewels as disconnected, non-cash product specifications and preview-only values. Any future real payment capability requires appropriate adult/legal/platform oversight and a separate compliance review.

### HIGH — Resolve in design before schema/API freeze

**H-01 — Progression model is incomplete.**  
The schema blueprint says membership progression needs a separate entitlement projection or a rebuild from gift events, but does not define the actual source, projection, indexes, recomputation strategy, or correction handling. Define male progression from qualifying sent gift value and female progression from qualifying received gift value, with the same thresholds, without mixing either with wallet balance or available jewels.

**H-02 — Reward eligibility source is underspecified.**  
The gift design says eligibility is determined from trusted account attributes and an approved policy version, but does not define the authoritative attribute, who may change it, how changes are audited, or what happens to historical rewards. This must be explicitly designed; do not trust a client-submitted gender/eligibility flag.

**H-03 — Transfer availability and product policy are not finalized.**  
The transfer API contract exists, but product constraints such as transfer limits, recipient restrictions, account states, rate limits, and whether internal member-to-member NXC transfers should exist at all are not fully specified. Keep transfer UI disconnected until those decisions are approved.

**H-04 — Gift self-send rule is provisional.**  
The latest lifecycle document defaults to rejecting self-gifting but marks it as unresolved. Obtain a product decision before encoding it as a permanent rule.

**H-05 — Idempotency storage lifecycle needs a retention/recovery policy.**  
Define key scope, retention period, uniqueness across operation types, behavior for rejected requests, and reconciliation for unknown commit outcomes. Do not expire idempotency records while a replay could duplicate a posting.

**H-06 — Schema reconciliation and index support are incomplete.**  
The current bootstrap skips existing columns by key without verifying type/size/required attributes. Multi-column unique indexes and all proposed constraints must be validated against the target TablesDB service. No wallet migration should use the current bootstrap unchanged.

**H-07 — Transaction envelope state semantics need tightening.**  
The schema proposes pending/committed/failed/reversed statuses while the lifecycle relies on one atomic commit. Define whether pending records are durable outside the posting transaction, how unknown commit outcomes are reconciled, and how a committed record remains immutable. Avoid a design where a status update can disagree with the journals.

**H-08 — Catalog and gift event versioning needs full policy.**  
The gift event stores catalog version and price snapshot, which is correct. Define how archived versions remain resolvable, how asset changes are handled, and how deactivated gifts affect old receipts. The client must never submit an authoritative price.

### MEDIUM — Required before release

**M-01 — Ledger sign convention should be formalized.**  
The docs use positive amounts plus debit/credit direction. Specify the normal balance convention for each account type and the exact reconciliation equation so that "balanced" cannot be interpreted differently by separate implementations.

**M-02 — API contract lacks a complete status/reconciliation endpoint.**  
The transfer lifecycle includes UNKNOWN, but the API contract does not yet fully define a safe authenticated status lookup by idempotency reference. Add this before implementation; never retry with a new key just because a response was lost.

**M-03 — Gift receipt/privacy details need review.**  
Define which gift details are visible to sender, recipient, room participants, and admins. Do not expose internal user IDs, ledger account IDs, or private account attributes.

**M-04 — Admin exception workflow is conceptual only.**  
The documents prohibit direct balance edits, which is correct. A future exception process still needs independent authorization, reason codes, dual control, immutable audit, and reconciliation. Do not implement a generic "adjust balance" field.

**M-05 — QA coverage is specified but not executed.**  
The existing integration test only covers a single-row social request transaction. Wallet/gift/jewel atomicity, concurrency, duplicate requests, rollback, bigint, and projection reconciliation remain untested. A written test matrix is not a passing test suite.

## 4. Cross-document consistency check

| Area | Current agreement | Review result |
|---|---|---|
| NXC and JEWEL separate | Separate journals and unit-specific balancing | Consistent |
| Gift pricing | Server-side versioned catalog snapshot | Consistent |
| Gift completion | No ordinary cancellation | Consistent |
| Reward rate | 1 qualifying gift NXC = 1 jewel | Consistent |
| Jewel conversion | 2 jewels = 1 NXC; odd remainder preserved | Product rule consistent; issuance policy unresolved |
| Lifetime progression | Conversion does not reduce it | Consistent; projection design incomplete |
| Membership thresholds | Silver 50k; Gold 500k; Premium 5m; Premium Gold 500m; Premium Black threshold unset | Consistent; final tier rule remains open |
| Identity | Authenticated session is source of sender identity | Consistent |
| Client trust | Client cannot set balances, prices, rewards, or status | Consistent |
| Admin | Read-only; no direct mint/edit/delete | Consistent |
| Atomicity | Related rows commit together | Required but unproven |
| Runtime/SDK | Node and bigint/SDK compatibility | Unresolved |
| Production readiness | No wallet implementation or live tests | Not ready |

## 5. Product rules to preserve

- One canonical NXC wallet per account in the product model.
- NXC and JEWEL remain separate units and separate accounting journals.
- 100 NXC qualifying gift value awards 100 jewels to an eligible female recipient.
- Conversion is 2 jewels for 1 NXC; odd remainder stays available.
- Lifetime gift progression is never reduced by conversion.
- Men's membership progression uses qualifying gifts sent; women's uses qualifying gifts received.
- Shared membership thresholds: Silver 50,000; Gold 500,000; Premium 5,000,000; Premium Gold 500,000,000 NXC. Premium Black remains without a numeric threshold until explicitly decided.
- A completed gift has no ordinary cancellation action.
- No direct admin balance edits or mint controls.
- No member cash-out, cash marketplace, payout, escrow, or cash exchange.

## 6. Required decisions before next design freeze

1. Approve the accounting/clearing model for NXC gifts, jewel awards, and jewel conversion.
2. Decide whether self-gifting is allowed.
3. Define the trusted source and audit rules for jewel eligibility.
4. Define membership progression projection and rebuild policy.
5. Decide whether internal member-to-member NXC transfers remain in product scope and set safe product limits.
6. Define idempotency retention and unknown-outcome reconciliation.
7. Set a numeric safe maximum for all NXC/jewel values after SDK round-trip testing.
8. Keep Premium Black threshold explicitly undecided until product owner sets it.

## 7. Recommended next sequence

1. Freeze backend changes and keep all current screens disconnected previews.
2. Resolve product decisions 1–5 above in written policy.
3. Create a dedicated non-production Appwrite test environment.
4. Verify Node runtime, SDK transaction methods, bigint round-trip, multi-table commit/rollback, and conflict behavior.
5. Correct schema bootstrap reconciliation and index validation.
6. Run the complete wallet/gift/jewel test matrix on synthetic fixtures.
7. Only after a separate explicit approval, prepare a backend implementation change with redeployment warning and rollback plan.

## 8. Review conclusion

The documentation is a strong starting specification, but it is not engineering sign-off for implementation. The most important unresolved items are the accounting/issuance model, Appwrite transaction proof, runtime/SDK compatibility, and progression/eligibility source of truth.

**Final status: HOLD backend implementation. Continue only with product decisions, documentation, and disconnected UI previews.**

No source code, schema, Appwrite resource, secret, workflow, runtime setting, or deployment was changed during this review.
