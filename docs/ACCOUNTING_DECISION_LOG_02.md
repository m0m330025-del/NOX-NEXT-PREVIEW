# ACCOUNTING DECISION LOG 02 — JEWEL REWARD ELIGIBILITY

Status: Provisional product-design decision only. Nothing is activated; no balances, rewards, transfers, or financial operations are created.

## Decision 04 — Self-gifts

**Selected option: Exclude self-gifts from jewel rewards.**

- A gift event where sender and recipient resolve to the same account does not generate jewels.
- The gift may still appear in the product experience and its gift event history; this decision only excludes the jewel reward.
- Account identity must be determined server-side from authenticated account identifiers, not client-supplied display names or NOX IDs.
- The original gift event remains auditable; no event is deleted or rewritten.

## Previously approved provisional decisions

1. NXC spent on gifts is assigned to a platform-controlled reserve (Decision Log 01, option B).
2. NXC credited by jewel conversion is funded from that reserve; conversion must fail atomically if the reserve is insufficient (option 1).
3. Jewel rewards have no additional periodic cap, subject to anti-abuse controls (option 1).
4. Self-gifts do not qualify for jewel rewards (this log).

## Non-activation and safety boundary

These are internal design decisions only. Do not implement or activate wallet, reserve, conversion, reward, payout, or real-value operations from this document. Any future backend/schema/runtime change requires a separate explicit approval and redeployment warning.

## Next unresolved product decision

Define which gift-event statuses qualify for jewel rewards (for example, only successfully completed and finalized gift events), and how reversals or exceptional corrections should be handled without deleting the original event.
