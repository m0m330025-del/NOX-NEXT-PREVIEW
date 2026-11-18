# Game Entry and Play Rewards — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
The game economy is defined as follows:
- Entry cost: 5 internal NXC per game entry.
- Play reward: 100 internal NXC for each completed 30-minute eligible play interval.
- Maximum play reward: 200 internal NXC per eligible hour (two completed intervals).

## Interpretation and integrity requirements
- The 5 NXC entry cost is charged once per game entry, not per 30-minute interval.
- A reward is earned only for a completed, server-verified eligible play interval; merely leaving a game open or repeatedly reconnecting must not create rewards.
- Partial intervals do not earn a reward unless a later product decision defines carry-over.
- Entry charges and earned rewards must be recorded as separate auditable events.
- Enforce limits and duplicate prevention server-side.
- These are conceptual internal app units only, not cash or real-world monetary value. No cash-out, payout, purchase, or exchange is included.

## Open product detail
The exact eligibility rules for what counts as active/valid play, treatment of interrupted sessions, and whether unused partial time carries over remain undecided.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, runtime change, or live wallet/game operation is performed or activated.
