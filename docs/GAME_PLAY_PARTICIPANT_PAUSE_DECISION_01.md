# Game Play Participant Pause — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
If the other player leaves and the session no longer has at least two valid participants, pause the play-reward timer. When another valid player joins, resume the timer from the previously accumulated eligible time.

## Rules
- Paused time does not count toward the 30-minute reward interval.
- Previously accumulated eligible time in the same game entry/session is retained while paused.
- If the user exits the game, the accumulated partial time is discarded, as previously decided.
- A completed 30-minute eligible interval grants 100 NXC; maximum 200 NXC per eligible hour.
- The 10 NXC entry fee remains charged per game entry.
- Participant presence and timer transitions must be server-verified and auditable.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, runtime change, or live wallet/game operation is performed or activated. NXC is an internal conceptual app unit, not cash or real-world monetary value.
