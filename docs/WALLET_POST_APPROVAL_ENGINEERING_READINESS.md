# NOX Wallet — Post-Approval Engineering Readiness Check

**Date:** 2026-11-18  
**Branch:** `feature/moderation-functions-scaffold`  
**Status:** Read-only repository inspection; no application or Appwrite resources changed.

## 1. Approval confirmed
The product owner approved the member wallet and admin wallet preview direction in conversation. The approval record is `docs/WALLET_UI_DESIGN_APPROVAL.md`. This covers presentation and information architecture only, not production implementation.

## 2. Repository facts verified
- `wallet.html` is explicitly marked as an unconnected preview. It displays no balance or transaction history and does not submit transfers.
- `admin-wallet.html` is explicitly marked as an unconnected preview. Search and operational metrics are placeholders; no live admin access or balance mutation exists.
- The moderation function currently authenticates Appwrite user JWTs and supports social features, but there are no wallet routes in `functions/moderation/src/index.js`.
- The Appwrite bootstrap `scripts/setup-appwrite.mjs` currently defines social tables only. Its column factory supports varchar, datetime, and boolean; it does not yet create integer/bigint columns.
- The bootstrap currently treats a column with an existing key as present without validating its persisted type, size, or required setting. This must be corrected before it is used for financial schema migrations.
- Root `package.json` pins `node-appwrite@31.3.0` and permits Node >=22 <27. `functions/moderation/package.json` pins the same SDK but declares Node >=22 <23. This is a runtime policy mismatch that must be resolved before wallet deployment.
- A root `package-lock.json` was not found at the inspected branch path. The workflow installs dependencies from the function package directory and runs integration tests; no wallet-specific integration test file was found at the inspected expected path.
- `.github/workflows/test-appwrite-transactions.yml` is configured to run on pushes affecting `functions/moderation/**`. Because the Appwrite Function is branch-connected, backend changes may trigger a redeployment.

## 3. Required implementation gates
1. Resolve and document the supported Node runtime for the Appwrite Function and align package engine declarations.
2. Verify the exact TablesDB transaction and numeric-column methods exposed by the installed `node-appwrite@31.3.0` SDK, including lossless handling of 64-bit amounts.
3. Add schema reconciliation that validates existing column definitions instead of skipping by key alone.
4. Add private wallet tables and separate NXC / JEWEL journals only after the above checks pass.
5. Prove multi-table atomic commit and rollback, concurrent debit safety, duplicate idempotency-key rejection, and ledger balancing against a non-production test dataset.
6. Implement server-only wallet APIs with identity derived from the Appwrite session; never accept a client balance, recipient user ID, gift price, or transaction status as authoritative.
7. Keep the admin console read-only by default. Exceptional corrections must be append-only, reasoned, permission-checked, and separately approved.
8. Connect the UI only after API contract and tests are stable. Do not display invented balances, sample transactions, or optimistic success.

## 4. Product rules carried forward
- One central NXC wallet per account.
- NXC is an in-app unit; no member cash-out or member cash marketplace.
- Owner-operated primary issuance/top-ups only, with verified provider events before crediting.
- Transfers are internal NXC movements, atomically debiting and crediting both accounts.
- Gifts use the server-side catalog price snapshot; completed gifts are not ordinarily cancellable.
- Jewel conversion remains 2 JEWEL = 1 NXC; lifetime progression is retained and odd jewels are preserved.
- NXC and JEWEL remain separate accounting units with independently balanced journals.
- No direct admin balance-edit or mint control.

## 5. Explicit non-actions
This check did not modify `scripts/setup-appwrite.mjs`, function source, package manifests, workflows, secrets, runtime settings, Appwrite tables, or deployments. It did not run a live Appwrite transaction test.

## 6. Recommended next work item
Prepare an isolated implementation branch and a reviewed migration/test package. Before any backend commit on the deployment-connected branch, obtain explicit approval for the code change and its redeployment impact.
