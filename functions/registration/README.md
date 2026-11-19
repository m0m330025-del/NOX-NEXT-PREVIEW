# NOX NEXT registration function

This function creates an Appwrite Auth user and its private NOX profile as one server-controlled workflow.

## Contract
- Method: `POST /`
- JSON body: `{ "email": "...", "password": "...", "displayName": "..." }`
- Success: HTTP 201 with `userId` and `accountStatus: "APPROVED"`
- The browser creates its email/password session only after this success response.
- Passwords are never written to TablesDB or logs.
- A profile row is created with row ID equal to the Appwrite Auth user ID.
- Legacy profile rows with missing `accountStatus` remain unchanged and are denied by the membership gate.
- No IP-based account cap is applied. Temporary abuse throttling is keyed by a one-way hash of normalized email, not IP.

## Required environment
- `NOX_REGISTRATION_API_KEY`: server-only Appwrite API key with `users.write` and required TablesDB row read/write permissions for `users` and `registration_attempts`.
- `NOX_DATABASE_ID`: existing NOX_CORE database ID (defaults to the project database).
- Appwrite runtime-provided `APPWRITE_FUNCTION_API_ENDPOINT` and `APPWRITE_FUNCTION_PROJECT_ID`.

Never put the API key in browser files or GitHub source.

## Provisioning plan (not performed)
- Function ID: `nox-registration`
- Runtime: Node.js 22
- Entrypoint: `src/index.js`
- Root directory: `functions/registration`
- Execute access: Any (the function validates input and owns account creation).
- Deploy only after separately approving the Appwrite schema bootstrap and Function provisioning.
- Run the updated `scripts/setup-appwrite.mjs` first so the private `registration_attempts` table exists.
- Configure the function key as a protected server environment variable.

## Operational notes
- Per normalized email, at most three attempts are accepted in a rolling 15-minute window. This is a temporary abuse control, not a one-account-per-IP rule.
- The attempt table stores only a SHA-256 email digest and timestamp.
- A failed profile creation triggers a best-effort deletion of the just-created Auth user.
- This function is source code only until provisioned and deployed in Appwrite.
