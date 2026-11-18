# Game Reconnect Grace Period Decision 01

- Status: Provisional product decision; documentation only.
- Decision: If a player's connection drops unexpectedly, allow up to 5 minutes to reconnect to the same game session.
- Entry fee: A verified reconnect to the same session within the 5-minute grace period does not charge the 10 NXC entry fee again.
- Progress: Preserve already accumulated eligible play time for that same session during the grace period. Do not count disconnected time as eligible play time.
- Expiry: If the player does not reconnect within 5 minutes, close the session for that player and discard incomplete interval progress, consistent with the existing session-reset rule.
- Session integrity: Reconnect must be verified server-side and tied to the original account and session. A fresh session or deliberate exit is not a reconnect and follows the normal entry-fee and timer rules.
- Multiplayer eligibility: Reward time remains paused while fewer than two valid participants are present and resumes only when the server verifies the required participant count.
- Scope: NXC remains an internal conceptual app unit only. This decision does not authorize live issuance, wallet operations, or backend changes.
