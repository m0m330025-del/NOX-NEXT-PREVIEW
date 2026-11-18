# AI Engineering Recommendation Delegation Preference

**Project:** NOX NEXT  
**Status:** User preference recorded.

## User instruction
For remaining open product and engineering decisions, the user asks the assistant to evaluate the available options from an AI-assisted engineering perspective and select the recommended option on the user's behalf, rather than asking the user to choose every routine detail.

## Decision method
For each open decision:
1. Consider security, privacy, reliability, accessibility, maintainability, abuse prevention, user experience, and operational clarity.
2. Select the safest practical option that fits the already approved NOX NEXT requirements.
3. Explain the selected decision briefly and record it in project documentation when appropriate.
4. Clearly label recommendations as AI-assisted engineering recommendations, not approval by human engineers.
5. Do not silently override previously approved decisions.

## Decisions that still require explicit user approval
Ask the user before any decision that:
- materially changes a previously approved business rule or product direction;
- authorizes real-world financial activity, real-money value, payouts, cash exchange, or live issuance of app units;
- collects or shares sensitive personal data or changes identity-verification/privacy practices;
- changes production backend behavior, database schema, secrets, integrations, or deployment/redeployment;
- creates an irreversible or legally consequential action not already explicitly approved.

## Scope
This preference guides future recommendations only. It does not authorize implementation, deployment, live operations, collection of identity documents, or changes to connected services.
