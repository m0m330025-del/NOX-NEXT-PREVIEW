# Daily 100 NXC Claim Notification Decision 01

- Status: Provisional product decision; documentation only.
- Decision: Do not send a separate phone/push notification when the daily 100 NXC claim becomes available while the app is closed.
- In-app behavior: The claim popup is shown when the user opens the app and is eligible to claim.
- Claim interaction: The user must press «استلام» to claim.
- Availability: Dismissing the popup does not forfeit the claim. It remains available until successfully claimed.
- Cooldown: The next claim becomes eligible 24 hours after the last successful claim, subject to server-side enforcement and idempotency.
- Scope: NXC remains an internal conceptual app unit only. This decision does not authorize issuance, wallet operations, or backend changes.
- Implementation note: The popup and claim state must be driven by authoritative server state; do not rely on a client-side timer as the source of truth.
