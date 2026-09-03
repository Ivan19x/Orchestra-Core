-- ============================================================================
-- Orchestra-Core database schema (Supabase / PostgreSQL)
--
-- HOW TO RUN: Supabase dashboard → SQL Editor → New query → paste all of this
-- → Run. It is safe to run more than once (everything is IF NOT EXISTS).
-- ============================================================================

-- ── users ───────────────────────────────────────────────────────────────────
-- One row per account. `has_paid` is the single flag the whole site reads to
-- decide whether someone can open a premium lesson.
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text        not null,
  license_key   text unique,
  has_paid      boolean     not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists users_email_idx on users (email);

-- ── payments ────────────────────────────────────────────────────────────────
-- One row per M-Pesa STK Push attempt.
--   tx_ref              our own reference, what the frontend polls on
--   checkout_request_id Safaricom's id — how we match their callback to us
--   mpesa_receipt       e.g. "SLK7XQ2P9M", the code the customer also gets
create table if not exists payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references users(id) on delete cascade,
  tx_ref               text unique not null,
  amount               integer     not null,
  currency             text        not null default 'KES',
  payment_method       text        not null default 'mpesa',
  phone                text,
  status               text        not null default 'pending',  -- pending | completed | failed
  merchant_request_id  text,
  checkout_request_id  text,
  mpesa_receipt        text,
  result_desc          text,
  created_at           timestamptz not null default now(),
  completed_at         timestamptz
);

create index if not exists payments_tx_ref_idx      on payments (tx_ref);
create index if not exists payments_checkout_id_idx on payments (checkout_request_id);
create index if not exists payments_user_idx        on payments (user_id);

-- ── Row-level security ──────────────────────────────────────────────────────
-- The API talks to Supabase with the service_role key, which bypasses RLS.
-- Enabling RLS with no permissive policy means that if the anon/public key ever
-- leaks (it is a *public* key — it ships in browser bundles by design), these
-- tables still cannot be read or written from the browser. This is strictly
-- safer than leaving RLS off, and changes nothing for the API.
alter table users    enable row level security;
alter table payments enable row level security;

-- ============================================================================
-- MIGRATING an existing database that predates this schema? Run these too.
-- They are no-ops on a fresh database created by the statements above.
-- ============================================================================
alter table payments add column if not exists phone               text;
alter table payments add column if not exists merchant_request_id text;
alter table payments add column if not exists checkout_request_id text;
alter table payments add column if not exists mpesa_receipt       text;
alter table payments add column if not exists result_desc         text;
alter table payments add column if not exists completed_at        timestamptz;

-- The old IntaSend integration stored its invoice id here; nothing reads it now.
alter table payments drop column if exists flw_tx_id;

-- Accounts are email + password only now — one-time SMS/email codes are gone.
drop table if exists otp_codes;
alter table users drop column if exists phone;
