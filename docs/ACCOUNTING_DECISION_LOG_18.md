# Decision Log 18 — Admin Gift Analytics Dashboard

**Decision:** 21  
**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
The administration gift history will have a separate analytics dashboard with basic statistics only.

## Dashboard metrics
- Total conceptual NXC value of completed administration gifts.
- Number of distinct recipients.
- Number of completed gifts.

## Boundaries
- This dashboard is read-only and does not issue, transfer, or alter NXC.
- It must not display NXC as cash or imply real-world monetary value.
- No charts, month-over-month comparisons, advanced date analysis, or expanded status analytics are included in this decision.
- Any later expansion requires a separate product decision.
- This documentation change does not modify Appwrite schemas, functions, workflows, secrets, or runtime configuration, and does not activate any wallet or gift operation.
