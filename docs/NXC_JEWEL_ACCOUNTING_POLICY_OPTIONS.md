# NOX NEXT — NXC & Jewel Accounting Policy Options

**Status:** Decision paper only; not an approved accounting policy and not implemented.  
**Date:** 2026-11-18  
**Branch:** `feature/moderation-functions-scaffold`  
**Related:** `CONSOLIDATED_WALLET_GIFTS_JEWELS_ENGINEERING_REVIEW.md`, `WALLET_GIFTS_JEWELS_SCHEMA_BLUEPRINT.md`, `LEDGER_INVARIANTS_AND_POSTING_RULES.md`

## 1. Purpose and scope

This paper resolves the accounting questions that block the future internal-unit wallet and virtual-gift design. It deliberately presents policy choices instead of silently choosing how NXC is created, consumed, or funded.

NXC and jewels in this document are conceptual in-app units only. This design does not authorize real-money purchases, cash-out, payouts, member cash exchange, or any live-value transfer. No balances are seeded and no transaction is enabled.

## 2. Units must remain separate

Maintain independent accounting ledgers:

- **NXC ledger:** integer NXC amounts only.
- **JEWEL ledger:** integer jewel amounts only.
- **Progression counters:** lifetime qualifying gift values, not spendable balances.

Never add jewels directly to NXC in one journal entry. Conversion is represented by two linked, separately balanced postings, one in each unit ledger.

## 3. Virtual gift accounting — unresolved policy choice

When a sender spends 100 NXC on a virtual gift, the sender's NXC wallet is debited by 100. The balancing credit must follow one explicitly approved policy:

### Option A — NXC is consumed (burned)

- Debit sender wallet: 100 NXC.
- Credit NXC burn/retirement account: 100 NXC.
- The units leave the active spendable supply.
- No platform treasury balance or member receivable is created.

This is the simplest model if gift spending permanently removes NXC from circulation.

### Option B — NXC moves to a platform-controlled reserve

- Debit sender wallet: 100 NXC.
- Credit platform NXC reserve: 100 NXC.
- The units remain in the controlled reserve and are not member-spendable.
- Any later use of reserve NXC requires a separate approved policy and auditable posting.

This model is appropriate only if the product intends to retain spent units in a controlled internal reserve. It must not be interpreted as revenue or cash.

### Decision required

Choose A or B. Do not split a gift between these treatments or infer a platform share. No fees, commissions, creator share, or revenue percentage are defined by this paper.

## 4. Jewel reward accounting

For a qualifying gift worth 100 NXC:

- Gift event records the 100 NXC catalog price snapshot.
- Eligible recipient receives 100 JEWEL.
- JEWEL journal records the award as a separate unit-specific issuance.
- A unique source reference to the gift event prevents duplicate awards.

The JEWEL journal must balance using an explicitly named JEWEL reward issuance/control account. This is an accounting control account, not a member, cash, or NXC wallet.

A reward is granted only after the gift event and NXC posting can commit atomically. If reward eligibility cannot be determined reliably, reject the complete gift attempt rather than commit a gift with an uncertain reward.

## 5. Jewel conversion — unresolved NXC funding choice

The confirmed product conversion ratio is:

- 2 JEWEL = 1 NXC.
- Integer arithmetic only.
- If a member has 5 JEWEL, conversion of 4 yields 2 NXC and leaves 1 JEWEL.
- Conversion does not reduce lifetime gift progression.

The conversion requires two linked postings:

### JEWEL side

- Debit member's available JEWEL: amount of jewels converted.
- Credit JEWEL conversion/retirement control: same amount.

### NXC side

One of the following must be explicitly approved:

**Option 1 — Reserved NXC pool:** debit a controlled NXC reward reserve and credit the member NXC wallet at the calculated rate. The reserve must have an auditable funded balance and may not go negative.

**Option 2 — Authorized NXC issuance:** debit an NXC issuance/control account and credit the member wallet. This represents newly authorized in-app units and requires a strict issuance authorization, cap, audit, and reconciliation policy.

No conversion may proceed until one NXC funding choice is approved and its source balance/authorization is verifiable. Do not create NXC from an unexplained balancing entry.

## 6. Core ledger equations

For every committed journal transaction, within one unit:

`sum(debits) = sum(credits)`

For each NXC wallet projection:

`closing balance = opening balance + posted credits - posted debits`

For each JEWEL account projection:

`closing jewels = opening jewels + posted awards - posted conversions`

Across a linked jewel conversion, the JEWEL and NXC entries are not added together. Each unit ledger balances independently.

All amounts are positive bounded integers; direction is represented by debit/credit fields. Never use floating-point arithmetic.

## 7. Progression is not a wallet account

Maintain lifetime qualifying gift value separately:

- Sender lifetime qualifying sent-gift value increases by the qualifying catalog price snapshot.
- Eligible recipient lifetime qualifying received-gift value increases by that same qualifying value according to the approved membership policy.
- Jewel conversion does not reduce either lifetime counter.
- Wallet balance, reserve balance, jewel balance, and lifetime progression must never be substituted for one another.

Membership thresholds already recorded in the product specification:

| Tier | Lifetime qualifying gift value |
|---|---:|
| Silver | 50,000 NXC |
| Gold | 500,000 NXC |
| Premium | 5,000,000 NXC |
| Premium Gold | 500,000,000 NXC |
| Premium Black | Threshold not yet defined |

Men's progression uses qualifying gifts sent; women's progression uses qualifying gifts received. The trusted eligibility source and treatment of account attribute changes remain unresolved and must be policy-versioned and audited. Do not accept a client-submitted eligibility value.

## 8. Required control accounts and restrictions

The final chart of accounts must explicitly define, at minimum, the selected accounts for:

- member NXC wallets;
- selected gift-spend destination (burn/retirement or platform reserve);
- NXC reward reserve or authorized issuance control for jewel conversion;
- member JEWEL accounts;
- JEWEL reward issuance control;
- JEWEL conversion/retirement control.

Control accounts are not user-editable balances. No admin UI may directly mint, debit, credit, or overwrite a wallet or jewel account. Any future exceptional correction must be a separately authorized append-only adjustment with reason, actor, dual approval, and audit evidence.

## 9. Reconciliation requirements

Before any implementation is approved, prove:

1. Sum of all NXC journal postings reconciles to all NXC wallet and control-account projections.
2. Sum of all JEWEL journal postings reconciles to JEWEL member and control-account projections.
3. Gift event totals reconcile to sender and recipient lifetime progression counters under the approved eligibility policy.
4. Jewel awards reconcile one-to-one to qualifying gift event references.
5. Jewel conversions reconcile the JEWEL debit and NXC credit using the exact integer ratio.
6. No reserve/control account is negative unless an explicitly approved policy permits it (default: never negative).
7. Rebuilding projections from immutable journals yields the same balances as stored projections.

## 10. Decisions required from product owner

Do not proceed to schema freeze or backend implementation until these choices are explicitly approved:

| Decision | Options | Current state |
|---|---|---|
| Gift-spent NXC destination | A: burn/retire; B: platform-controlled reserve | Open |
| NXC funding for jewel conversion | 1: reserved NXC pool; 2: authorized issuance | Open |
| JEWEL reward issuance cap | Defined policy/cap required | Open |
| NXC maximum safe integer | Set only after SDK serialization and numeric tests | Open |
| Eligibility source and change policy | Trusted server-side account attribute + audit policy | Open |
| Self-gifting | Allow or reject | Open |
| Premium Black threshold | Explicit numeric threshold or separately defined criterion | Open |

## 11. Review gates

- Validate the accounting policy with a qualified accounting/compliance reviewer before any real-value interpretation.
- Verify the exact TablesDB SDK and integer serialization in an isolated non-production environment.
- Validate atomic multi-table transactions, idempotency, conflicts, and projection rebuilds.
- Approve the final chart of accounts and all unit-specific posting rules.
- Obtain separate explicit approval before any backend change; the connected branch may trigger Appwrite Function redeployment.

## 12. Explicit non-actions

This document does not choose an option on the user's behalf. It adds no code, route, schema, index, secret, workflow, Appwrite resource, or balance. It performs no transaction and enables no real-money feature.
