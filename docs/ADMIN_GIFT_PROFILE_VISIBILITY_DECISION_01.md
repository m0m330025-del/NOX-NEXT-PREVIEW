# Administration Gift Profile Visibility — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
Administration gifts received by a member will appear in that member's profile gift history, in addition to the relevant wallet activity history.

## Display and privacy rules
- Identify the event clearly as an administration gift.
- Show the conceptual NXC amount, completion date/time, and the administration note where applicable.
- Do not expose internal staff-only audit details or private administrative metadata in the member profile.
- Keep the member-facing history read-only.
- NXC is an internal conceptual unit, not cash or real-world monetary value.

## Activation boundary
Documentation only. This decision does not change Appwrite schemas, functions, workflows, secrets, or runtime configuration and does not activate wallet or gift operations.
