# Daily 100 NXC Claim — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
Each eligible user is shown an in-app claim popup offering 100 NXC every 24 hours. The user must press **استلام** to claim the reward; it is not credited automatically merely because the popup appears.

## User experience
- Show a popup when the user becomes eligible.
- Display the reward amount as 100 NXC and a clear **استلام** action.
- On successful claim, confirm receipt and show when the next claim becomes available.
- If the user dismisses the popup without claiming, keep the reward available until claimed; do not silently expire it unless a separate decision defines expiry.
- The next claim becomes eligible 24 hours after the previous successful claim (rolling 24-hour cooldown).

## Integrity and safety
- Enforce eligibility and the 24-hour cooldown on the server, not only in the client.
- A claim must be idempotent so repeated taps or retries cannot grant the same reward more than once.
- Record each successful claim as a separate auditable event.
- NXC is an internal conceptual app unit only, not cash or real-world monetary value. This feature does not provide cash-out, payout, or real-money exchange.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, or runtime changes; no wallet operation or reward issuance is activated.
