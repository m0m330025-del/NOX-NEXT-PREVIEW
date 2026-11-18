# AI Engineering Recommendation — Valid Active Gameplay Definition

**Review type:** AI-assisted engineering recommendation.  
**Status:** Provisional technical rule; documentation only. Not human sign-off. No implementation or deployment is authorized.

## Recommended definition

A player is eligible to accumulate reward time only when the authoritative game service confirms all of the following:

1. The player is authenticated and joined to a valid, non-ended game session.
2. At least two distinct eligible participants are present in that same session.
3. The game is in a playable state (not lobby-only, loading, paused, ended, or waiting for players).
4. The player is not disconnected, suspended, reward-restricted, or marked idle by the game-specific rules.
5. The server receives valid game-state progression or participation events appropriate to that particular game.
6. Server heartbeat and session ownership checks remain valid.

## Idle and inactivity handling

- Do not award time merely for leaving the game screen open or sending heartbeats.
- Each game must define its own meaningful participation events (for example, a valid turn/action in a turn-based game or a server-confirmed round/action in a real-time game).
- If the player stops participating beyond that game's configured inactivity window, pause that player's eligible-time accumulation and mark the player idle.
- Resume only after a valid participation event and server revalidation.
- Do not set a universal inactivity duration until the actual game modes and their normal pacing are documented.

## Multiplayer and reconnect interaction

- If fewer than two valid participants remain, pause reward accumulation for all affected participants.
- The previously selected five-minute unexpected-disconnect grace period remains: reconnect to the same session within five minutes, no second entry fee, preserve completed eligible time, and do not count disconnected time.
- A deliberate exit or expired grace period ends the participation and discards incomplete interval progress.

## Reward integrity

- A 30-minute reward interval must be derived from accumulated server-verified eligible time, not client timers.
- Each interval has a unique session-bound identifier and can be posted at most once.
- Apply the 2,000 NXC per-account Cairo-day cap across all eligible games and devices.
- Log awarded, paused, idle, rejected, expired, and retried intervals for audit and QA.

## Implementation prerequisite

Before coding, document the actual game modes and their meaningful participation events. Then create tests for idle users, passive open screens, valid turns/actions, participant departure, reconnect, concurrent sessions, and duplicate interval submissions.

**Verdict:** Approve this general framework. Defer exact inactivity windows and activity-event definitions until the game modes are specified. NXC remains an internal conceptual unit only.
