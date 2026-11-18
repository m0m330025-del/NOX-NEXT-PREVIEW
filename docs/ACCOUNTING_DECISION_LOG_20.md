# Decision Log 20 — Admin Gift Analytics Date Filters

**Decision:** 23  
**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
The administration gift analytics dashboard will support these date filters:
- Today
- This week
- This month
- This year
- Custom date range

## Reporting rules
- Date boundaries must use the platform's explicitly configured reporting timezone.
- The custom range must validate start date <= end date.
- All metrics remain based on successfully completed administration gift events within the selected period.
- Overall totals and men/women breakdowns must use the same selected date range.
- The dashboard remains read-only and does not issue, transfer, or alter NXC.
- NXC is an internal conceptual unit, not cash or real-world monetary value.

## Activation boundary
This is a documentation-only decision. It does not change Appwrite schemas, functions, workflows, secrets, or runtime configuration and does not activate wallet or gift operations.
