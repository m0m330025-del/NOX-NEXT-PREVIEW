# NOX NEXT — Authentication and Account Access

## Approved product decision
NOX NEXT is an application for all ages. There is no adults-only gate or minimum age requirement in signup.
- Self-service registration is open.
- A newly created Appwrite account receives a session immediately after successful account creation.
- Existing accounts can sign in immediately with email and password.
- No administrator approval or manual activation step is part of signup/login.
- There is no one-account-per-IP restriction.
- Optional profile fields must not block account creation.
- Do not collect date of birth by default.

## Authentication implementation
The browser uses Appwrite Account email/password APIs. The public endpoint and project ID are identifiers, not secrets. Never place an Appwrite API key or privileged credential in frontend code.
1. Create the Appwrite account.
2. Immediately create an email/password session after successful signup.
3. Fetch the authenticated account and navigate into the app.
4. Sign in existing accounts by creating a session and fetching the account.
5. Show clear errors for duplicate email, invalid credentials, rate limits, network errors, and unregistered web platforms.

Successful Appwrite Auth does not itself provision a NOX profile row, NOX ID, friendships, or protected backend permissions. Those require their own trusted backend workflow and must not be represented as completed by an Auth session alone.

## Privacy and safety
All-ages availability does not waive privacy or child-safety obligations. Minimize personal data collection, do not request birth dates by default, and apply age-appropriate privacy, moderation, and legal requirements to features processing children's personal data.

## Release verification
- Verify Email/Password is enabled in the NOX NEXT CORE Appwrite project.
- Add each deployed hostname to Appwrite Platforms before testing from that hostname.
- Test new account creation followed by immediate session creation.
- Test existing-account login, duplicate email, invalid password, logout, and session persistence.
- Never claim a real account test unless performed with an authorized test account.
