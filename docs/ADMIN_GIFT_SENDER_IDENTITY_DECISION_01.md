# Administration Gift Sender Identity — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
In the recipient-facing gift history and in-app notification, the sender is displayed as **إدارة NOX** only. The individual administrator's name is not disclosed to the recipient.

## Audit boundary
- Preserve the responsible administrator's identity in the restricted internal audit record for authorized reviewers.
- Do not expose staff-only audit metadata in member-facing screens.
- This does not change the previously approved immutable gift note.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, or runtime changes; no wallet or gift operation is activated. NXC remains an internal conceptual unit, not cash or real-world monetary value.
