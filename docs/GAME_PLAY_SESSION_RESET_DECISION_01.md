# Game Play Session Timer Reset — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
If a user exits a game before completing a 30-minute eligible play interval, the partial time is discarded. On re-entry, the 30-minute reward timer starts from zero.

## Rules
- No partial-time carry-over between separate game sessions.
- A 100 NXC reward is earned only after a completed 30-minute eligible interval in the current session.
- Two completed intervals can earn up to 200 NXC in an eligible hour.
- The 10 NXC entry fee remains charged once per game entry.
- Session boundaries and rewards must be server-verified and recorded to prevent duplicate claims.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, runtime change, or live wallet/game operation is performed or activated. NXC is an internal conceptual app unit, not cash or real-world monetary value.
