# Game Play Multiplayer Eligibility — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
Play-time rewards are eligible only when at least one other player is present in the same game session. Solo play does not earn the 30-minute NXC reward.

## Rules
- The 10 NXC entry fee remains charged per game entry.
- The 100 NXC reward requires a completed 30-minute eligible interval.
- The 200 NXC per eligible hour maximum remains unchanged.
- The session must include at least two distinct, valid participants for the interval to qualify.
- Participant presence and eligible play time must be verified server-side; reconnects, duplicate accounts, idle presence, or fabricated participants must not create rewards.
- If the session no longer meets the participant requirement, the interval is not eligible. Exact pause/reset behavior for temporary participant departures remains a separate decision.
- Exiting before the interval completes discards partial time, as already decided.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, runtime change, or live wallet/game operation is performed or activated. NXC is an internal conceptual app unit, not cash or real-world monetary value.
