# Administration Gift Profile Sharing — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
A recipient may voluntarily share a post about receiving an administration gift on their NOX profile using a dedicated Share action.

## Privacy and consent rules
- Sharing is opt-in and requires an explicit user action; receiving a gift never publishes a post automatically.
- The default shared post identifies the source as "إدارة NOX".
- Do not include the recipient's NXC amount, private administration note, or internal audit metadata by default.
- The recipient can review the post before publishing and cancel sharing.
- The share action must not change wallet balances, gift records, or gift status.
- No external social-network sharing is implied by this decision; it concerns the NOX profile only.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, or runtime changes; no wallet or gift operation is activated. NXC remains an internal conceptual unit, not cash or real-world monetary value.
