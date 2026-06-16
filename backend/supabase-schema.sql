-- Orchestra-Core database schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique,
  phone        text unique,
  license_key  text unique,
  has_paid     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists otp_codes (
  id           uuid primary key default gen_random_uuid(),
  identifier   text not null,   -- email or phone (normalised)
  code_hash    text not null,
  expires_at   timestamptz not null,
  used         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists otp_codes_identifier_idx on otp_codes (identifier, used);

create table if not exists payments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references users(id),
  tx_ref           text unique not null,
  amount           integer not null,
  currency         text not null default 'KES',
  payment_method   text,                  -- 'mpesa' | 'card'
  status           text not null default 'pending',  -- 'pending' | 'completed' | 'failed'
  flw_tx_id        text,
  created_at       timestamptz not null default now()
);

-- Row-level security: the API uses the service role key so RLS can stay off,
-- but enable it and restrict access once you add direct-browser Supabase calls.
alter table users disable row level security;
alter table otp_codes disable row level security;
alter table payments disable row level security;
