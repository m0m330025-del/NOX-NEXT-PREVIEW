# Decision Log 19 — Recipient-Group Gift Analytics

**Decision:** 22  
**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
The administration gift analytics dashboard will show separate basic statistics for men and women, alongside the overall totals.

## Displayed metrics
For each recipient group:
- Total conceptual NXC value of completed administration gifts.
- Number of distinct recipients.
- Number of completed gifts.

The dashboard will also retain the corresponding overall totals.

## Privacy and accounting boundaries
- Grouping is based only on the account category already used by NOX; do not infer or derive it.
- Display aggregate statistics, not sensitive personal profiles.
- This is read-only analytics and does not issue, transfer, or alter NXC.
- NXC is an internal conceptual unit, not cash or real-world monetary value.
- Documentation only: no Appwrite schema, function, workflow, secret, or runtime changes; no wallet or gift operation is activated.
