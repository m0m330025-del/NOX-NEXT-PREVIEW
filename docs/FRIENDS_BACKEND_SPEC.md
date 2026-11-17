# NOX NEXT — Friends Backend Implementation Blueprint

This document is the implementation contract for replacing the current browser-only friend demo with a real authenticated backend.

## Current status

The deployed site is a static GitHub Pages frontend. It has no trusted server, database, session service, or realtime channel. Browser localStorage is not an account system and must never be treated as authoritative.

## 1. Database migration (PostgreSQL)

The following schema is the baseline for a PostgreSQL backend. Apply it only through a trusted server-side migration process.

```sql
create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  nox_id varchar(24) not null,
  nox_id_normalized varchar(24) not null unique,
  display_name varchar(80) not null,
  username varchar(30) not null unique,
  email varchar(254) not null unique,
  password_hash text not null,
  birth_date date not null,
  gender varchar(24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nox_id_format check (nox_id_normalized ~ '^NOX-[A-Z0-9]{2,6}-[A-Z0-9]{2,6}$')
);

create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  status varchar(16) not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_request_not_self check (sender_id <> recipient_id)
);

create unique index friend_requests_one_pending_direction
  on friend_requests(sender_id, recipient_id) where status = 'pending';

create table friendships (
  user_low uuid not null references users(id) on delete cascade,
  user_high uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  constraint friendship_sorted check (user_low < user_high)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  type varchar(40) not null,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread
  on notifications(user_id, created_at desc) where read_at is null;

create table user_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
```

The API must normalize NOX IDs before lookup and rely on the unique database constraint to prevent duplicates. Passwords must be hashed using Argon2id or an equivalent modern password-hashing function; never store plaintext passwords.

## 2. API contract

All endpoints require HTTPS. Authenticated endpoints derive the acting user from a secure server-validated session/token; never accept a client-supplied sender/user ID as authority.

- `GET /api/v1/users/by-nox-id/{noxId}` — return only a minimal public profile, or a generic not-found response.
- `POST /api/v1/friend-requests` — body: `{ "noxId": "NOX-..." }`; server resolves recipient and creates a pending request.
- `GET /api/v1/friend-requests?box=incoming|outgoing` — list the signed-in user's requests.
- `POST /api/v1/friend-requests/{requestId}/accept` — recipient-only; transactionally accept and create the friendship.
- `POST /api/v1/friend-requests/{requestId}/decline` — recipient-only.
- `DELETE /api/v1/friend-requests/{requestId}` — sender-only cancellation while pending.
- `GET /api/v1/friends` — list confirmed friends for the signed-in user.
- `GET /api/v1/notifications` and `POST /api/v1/notifications/{id}/read` — private notification access.

## 3. QR identity

Do not encode a permanent database ID, email, or private account data in a QR code. The server should issue a random, high-entropy, short-lived QR token, store only its hash, and allow revocation/rotation. A scan resolves the token to a minimal profile, then the user explicitly confirms sending a friend request. Expired or revoked tokens must fail closed.

## 4. Transaction and authorization rules

- Accepting a request must update its status and create one canonical friendship row in a single database transaction.
- Canonical friendship keys are sorted UUID pairs, preventing duplicate friendships in opposite directions.
- Only the recipient can accept/decline; only the sender can cancel.
- Prevent self-requests, duplicate pending requests, and requests between already-friended users.
- Add block/report controls before public launch; blocked users cannot discover or contact the blocker.
- Apply per-account and per-IP rate limits to lookup, request creation, login, and QR resolution.
- Return generic lookup errors where needed to reduce account enumeration.
- Validate every input server-side and record security-relevant events without logging secrets.

## 5. Notifications and synchronization

Create a notification in the same transaction as a new request or accepted request. Deliver updates through authenticated WebSocket/SSE or a managed realtime service. Reconnect must fetch unread notifications from the database so offline devices catch up.

## 6. Privacy and age handling

Collect only the profile fields needed by the product. Keep date of birth private and calculate eligibility on the server. Any 18+ game area must have a server-enforced age gate; frontend checks alone are bypassable. Do not expose age or birth date in friend lookup responses.

## 7. Release checklist

- [ ] Choose backend host and PostgreSQL provider.
- [ ] Configure secrets as server-side environment variables, never in GitHub Pages files.
- [ ] Implement secure sign-up/login/session handling and account recovery.
- [ ] Apply the SQL migration and unique NOX ID constraint.
- [ ] Implement and test the endpoints above.
- [ ] Add abuse controls, block/report, privacy rules, and audit logging.
- [ ] Connect the frontend to the API and remove localStorage as the source of truth.
- [ ] Test two separate accounts on two devices, including request, accept, notification, logout, and reconnect.
- [ ] Verify the 18+ game gate server-side before enabling that area.

## Important

This blueprint and migration are prepared in the repository. They do not create a live backend by themselves. Real cross-device accounts and friend requests remain disabled until a backend provider is selected, configured, and deployed.
