# Game Daily Reward Cap Message Decision 01

- Status: Provisional product decision; documentation only.
- Decision: When a user reaches the daily 2,000 NXC game-reward cap, show the following message once for that account and daily reward period: «وصلت إلى الحد اليومي للمكافآت، يمكنك مواصلة اللعب وتجديد المكافآت غدًا».
- Behavior: The user may continue playing, but no further play-time rewards are credited until the next daily reset in the configured platform timezone (Africa/Cairo).
- Display control: Do not repeat the message for every subsequent reward interval attempt during the same daily period.
- Enforcement: The server remains authoritative for the cap and for whether the message has already been shown/acknowledged.
- Scope: NXC remains an internal conceptual app unit only. This decision does not authorize live issuance, wallet operations, or backend changes.
