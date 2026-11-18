# Game Daily Reward Timezone Decision 01

- Status: Provisional product decision; documentation only.
- Decision: Reset the daily 2,000 NXC game-reward cap according to Egypt local time (Cairo).
- Technical timezone identifier: Use the IANA timezone `Africa/Cairo`, not a hard-coded UTC offset, so the server follows applicable local time and daylight-saving rules.
- Enforcement: The server is authoritative for the reset boundary. Client device timezone and client clock must not affect eligibility.
- Scope: NXC remains an internal conceptual app unit only. This decision does not authorize live issuance, wallet operations, or backend changes.
