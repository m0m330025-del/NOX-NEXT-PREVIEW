-- NOX NEXT PostgreSQL baseline schema.
-- Apply only on a configured backend database, never from browser code.
create extension if not exists pgcrypto;

create table if not exists users (
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
  constraint users_nox_id_format check (nox_id_normalized ~ '^NOX-[A-Z0-9]{2,6}-[A-Z0-9]{2,6}$')
);

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  status varchar(16) not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_requests_not_self check (sender_id <> recipient_id)
);

create unique index if not exists friend_requests_one_pending_direction
  on friend_requests(sender_id, recipient_id) where status = 'pending';

create table if not exists friendships (
  user_low uuid not null references users(id) on delete cascade,
  user_high uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  constraint friendships_sorted check (user_low < user_high)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  type varchar(40) not null,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread
  on notifications(user_id, created_at desc) where read_at is null;

create table if not exists user_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
