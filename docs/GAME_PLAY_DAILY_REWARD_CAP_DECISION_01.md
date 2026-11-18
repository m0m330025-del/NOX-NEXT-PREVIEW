# Game Play Daily Reward Cap — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
The maximum play-time reward is 2,000 NXC per user per day.

## Calculation
- Each completed 30-minute eligible interval awards 100 NXC.
- The daily cap therefore allows at most 20 completed eligible intervals (10 hours of eligible play time).
- The existing maximum of 200 NXC per eligible hour remains unchanged.
- The 10 NXC game entry fee remains separate and is not a play reward.

## Accounting and reset rules
- Count only successfully completed, server-verified eligible intervals.
- Apply the cap across all eligible games for the same user, not separately per game.
- The daily cap resets at the platform's configured reporting timezone boundary; the exact timezone must be configured before implementation.
- Reaching the cap prevents further play-time rewards until the next daily reset; it does not affect access to play.
- Prevent duplicate interval rewards and record each awarded interval in the audit ledger.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, runtime change, or live wallet/game operation is performed or activated. NXC is an internal conceptual app unit, not cash or real-world monetary value.
