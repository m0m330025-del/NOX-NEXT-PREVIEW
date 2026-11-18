# Administration Gift Reason Visibility — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
The recipient-facing gift history will display the note/reason written by Administration for that gift, when provided.

## Consistency rules
- The same recipient-facing note appears in the gift history and the in-app notification.
- The sender is displayed as "إدارة NOX"; the individual administrator's identity remains restricted to the internal audit record.
- The note becomes immutable after successful completion and sending, as previously decided.
- Do not expose staff-only audit metadata.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, or runtime changes; no wallet or gift operation is activated. NXC remains an internal conceptual unit, not cash or real-world monetary value.
