# NOX Wallet UI Design Approval Record

**Decision:** Approved by product owner in conversation.
**Date:** 2026-11-18
**Scope approved:** Member wallet UI preview (`wallet.html/css/js`), admin wallet UI preview (`admin-wallet.html`), and the multidisciplinary design review in `WALLET_UI_MULTIDISCIPLINARY_DESIGN_REVIEW.md`.
**Branch:** `feature/moderation-functions-scaffold`

## Approved direction
- Keep one central NXC wallet per NOX account.
- Member screen shows available NXC, transfer, activity history, jewels entry point, and approved in-app usage.
- Transfers require server-resolved recipient identity and a final confirmation step.
- Admin wallet console is read-only by default and includes reconciliation and dual-approval adjustment request concepts.
- Maintain Arabic RTL and the existing NOX navy/purple/gold visual system.
- Do not show cash-out, member cash trading, or direct balance-edit controls.

## Approval boundary
This approval accepts the design direction and preview screens only. It does **not** authorize:
- Appwrite schema/table migrations;
- backend/API or wallet transaction implementation;
- payment-provider integration or NXC issuance changes;
- changes to secrets, environment variables, runtime, or workflows;
- deployment or redeployment of the Appwrite Function.

Those steps require their own implementation plan, technical verification, and explicit approval. Current screens remain previews and do not perform wallet transactions.
