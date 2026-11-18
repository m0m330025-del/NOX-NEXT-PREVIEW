# Administration Gift Note Immutability — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
Once an administration gift is successfully completed and its recipient-facing note is sent, that note is immutable. The system administrator cannot edit or delete it.

## Recordkeeping
- Preserve the original note with the completed gift event.
- Do not silently replace or remove the note.
- Any future correction process would require a separate product decision and an auditable amendment that preserves the original record.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, or runtime changes; no wallet or gift operation is activated. NXC remains an internal conceptual unit, not cash or real-world monetary value.
