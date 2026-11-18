# NOX Wallet UI — Multidisciplinary Design Review

**Review type:** Internal AI-assisted design review across UX, frontend architecture, backend/accounting, and security perspectives. This is not a review by employed or external human engineers.
**Status:** Design recommendation; no production integration.
**Existing visual system reviewed:** `jewels.html/css/js`, `membership.html/css`, and `home.html`.
**Target:** Arabic RTL member wallet and restricted admin wallet console.

## 1. Review findings

### UX / product perspective
- Keep one clear primary figure: available NXC. Do not mix it with jewels, membership progression, or cash equivalents.
- Place the four most common tasks near the balance: transfer, transaction history, gifts, and in-app purchases.
- The transfer flow must be staged: recipient NOX ID → server-resolved display name → amount → final confirmation. Do not combine recipient entry and final submission.
- History needs recognizable operation labels, signed NXC amounts, timestamps, status, and a short reference.
- On mobile, use stacked cards and a fixed-width readable action layout; avoid dense accounting tables.

### Visual design perspective
- Reuse the existing NOX palette: deep navy `#160b49`, purple `#6722ed`, pink accent `#ec36ad`, gold `#ffd66d`, pale lavender background, Cairo font, rounded cards.
- Use gold sparingly for the NXC balance and important value, not for every button.
- Maintain the same brand header and rounded hero style already used by Membership and Jewels.
- Use clear status text and icons; color must not be the only status indicator.

### Frontend architecture perspective
- Separate presentational components from data access.
- Treat all displayed wallet values as server-owned. Never derive authoritative balance from browser storage or local arithmetic.
- Loading, empty, error, restricted, and success states need distinct UI.
- Disable duplicate submission while a request is in flight; use a stable idempotency key per user intent and query transaction status after uncertain network outcomes.
- Do not show success toasts or update the authoritative balance until the server confirms a committed transaction.

### Backend / accounting perspective
- The wallet summary and history are projections of immutable committed ledger entries.
- Transfer, gift debit, and feature debit must be atomic and idempotent.
- Client sends recipient NOX ID and requested amount only; server resolves identity, validates amount, checks funds, and posts both sides.
- Gift price must be loaded from the active catalog version on the server.
- Jewel conversion is a linked two-unit operation: 2 JEWEL = 1 NXC; preserve odd jewel balances and lifetime progression.
- Admin must not have a direct balance-edit control.

### Security / abuse perspective
- Derive member identity from the verified Appwrite session.
- Enforce authorization, account state, rate limits, anti-replay, and private row permissions server-side.
- Never trust client price, balance, recipient identity, role, or transaction status.
- Admin wallet lookup is read-only by default. Exceptional corrections require a separate request/approval workflow and append-only adjustment entries.
- No member cash-out, cash marketplace, escrow, or member cash settlement surfaces.

## 2. Recommended member wallet information architecture

1. Header: NOX brand and return navigation.
2. Balance hero: “الرصيد المتاح” with NXC unit and a clear not-connected placeholder until live data exists.
3. Quick actions: تحويل NXC، سجل العمليات، الهدايا، المشتريات داخل التطبيق.
4. Transfer panel: recipient NOX ID lookup, verified recipient name, integer amount, review step, confirm.
5. Recent activity: operation, timestamp, status, signed amount, reference.
6. Wallet guidance: NXC is an in-app unit; no cash withdrawal or cash exchange.
7. Help / safety: report a transaction reference without exposing private payment credentials.

## 3. Recommended admin wallet information architecture

1. Admin-only header and permission indicator.
2. Aggregate operational metrics: wallet count, total user NXC liability, period credits/debits, reconciliation state. Label as accounting/operational metrics, not revenue.
3. Search by NOX ID/internal user ID.
4. Read-only wallet detail: status, projected balance, latest transactions, linked ledger references.
5. Reconciliation alerts: unbalanced journal, projection mismatch, duplicate source reference, negative projection.
6. Adjustment requests queue with reason, requester, second approver, and immutable outcome.
7. Explicitly no “edit balance” field or direct mint button.

## 4. Visual and interaction rules

- Arabic-first RTL, responsive from 360px mobile width upward.
- Use whole-number NXC display; no decimals or floating-point values.
- Use neutral status labels alongside color: مكتملة، قيد المراجعة، مرفوضة.
- Empty history must say no operations yet, not display invented sample transactions.
- Until backend connection, show “معاينة تصميم — غير متصل بالمحفظة” and placeholder balances. Any calculator is clearly a preview and cannot mutate data.
- Never hardcode a plausible member balance, fake NOX ID, fake transaction, or simulated success.
- Use accessible labels, visible keyboard focus, and confirmation before a transfer is submitted.

## 5. Sign-off gates before production

- Product owner approves transfer limits, restrictions, and copy.
- Engineering verifies Appwrite transaction behavior, SDK types, runtime compatibility, and server-side authorization.
- Security reviews role enforcement, replay protection, privacy, and abuse limits.
- QA verifies responsive layout, keyboard/screen-reader behavior, duplicate submits, insufficient funds, timeouts, and reconciliation.
- No backend/schema migration or Appwrite deployment is part of this design review.
