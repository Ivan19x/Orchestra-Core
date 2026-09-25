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


-- ============================================================================
-- CONSULTANTS — teachers who deliver Orchestra-Core sessions
-- Added September 2026. Safe to re-run.
--
-- THE MONEY MODEL, because it drives most of the columns below:
-- teachers deliver Orchestra-Core's own curriculum, so THE PLATFORM SETS THE
-- PRICE, not the teacher. A teacher never names their own rate — that is what
-- stops the same lesson costing KES 500 from one person and KES 5,000 from
-- another. A teacher is paid a monthly base plus a fixed fee per session
-- delivered; Orchestra-Core keeps whatever is left of the learner's payment.
-- Every money column on `bookings` is a snapshot taken at booking time, so
-- changing a rate later can never alter what is owed on a session already sold.
-- ============================================================================

create table if not exists consultants (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references users(id) on delete cascade,
  slug                text unique not null,
  full_name           text not null,
  headline            text,
  bio                 text,
  photo_url           text,
  specialities        text[] not null default '{}',

  -- ── pricing: ALL SET BY ORCHESTRA-CORE, never by the teacher ──
  -- What the learner pays per hour.
  hourly_rate_kes     integer not null default 0 check (hourly_rate_kes >= 0),
  -- What the teacher earns for delivering one session.
  session_fee_kes     integer not null default 0 check (session_fee_kes >= 0),
  -- Retainer paid monthly regardless of how many sessions they take.
  monthly_base_kes    integer not null default 0 check (monthly_base_kes >= 0),
  -- Label only, e.g. 'standard' or 'senior'. Drives nothing in code.
  tier                text not null default 'standard',

  -- which of 'online' / 'in_person' this teacher offers
  session_modes       text[] not null default '{online}',
  -- for in-person: the areas they will travel to
  service_area        text,

  status              text not null default 'pending',
    -- pending | verifying | approved | rejected | suspended

  -- ── vetting ──
  -- NOTE: we deliberately do NOT store a full national ID number. Under the
  -- Data Protection Act 2019 that is sensitive personal data with real breach
  -- consequences and no operational upside here — a human checks the document
  -- and only the fact of verification is recorded.
  qualifications      text,
  experience_years    integer,
  id_last4            text,
  documents_received  boolean not null default false,
  verified_at         timestamptz,
  review_notes        text,
  applied_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists consultants_status_idx on consultants (status);
create index if not exists consultants_slug_idx   on consultants (slug);

-- Recurring weekly availability, stored as minutes from midnight EAT.
-- Minutes rather than a `time` column keeps slot arithmetic trivial and
-- timezone-safe: Kenya is UTC+3 all year, with no daylight saving.
create table if not exists consultant_availability (
  id            uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),  -- 0 = Sunday
  start_minute  smallint not null check (start_minute >= 0 and start_minute < 1440),
  end_minute    smallint not null check (end_minute > 0 and end_minute <= 1440),
  check (end_minute > start_minute)
);

create index if not exists availability_consultant_idx on consultant_availability (consultant_id, weekday);

create table if not exists bookings (
  id                  uuid primary key default gen_random_uuid(),
  ref                 text unique not null,
  consultant_id       uuid not null references consultants(id),
  user_id             uuid not null references users(id),
  starts_at           timestamptz not null,
  duration_minutes    integer not null default 60 check (duration_minutes > 0),
  mode                text not null check (mode in ('online', 'in_person')),
  location            text,          -- in-person: where the session happens
  meeting_link        text,          -- online: the teacher's video link
  learner_note        text,
  -- ── money (KES, all snapshotted at booking time) ──
  hourly_rate_kes     integer not null,   -- the platform rate then in force
  amount_kes          integer not null,   -- what the learner was charged
  teacher_fee_kes     integer not null,   -- what the teacher earns for it
  platform_fee_kes    integer not null,   -- what Orchestra-Core keeps
  status              text not null default 'pending_payment',
    -- pending_payment | confirmed | cancelled | completed | failed
  -- ── M-Pesa ──
  phone               text,
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt       text,
  result_desc         text,
  paid_at             timestamptz,
  -- ── payout to the teacher, settled monthly ──
  payout_month        text,          -- 'YYYY-MM' the session falls in
  payout_status       text not null default 'unpaid',   -- unpaid | paid
  payout_reference    text,
  payout_paid_at      timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists bookings_consultant_idx on bookings (consultant_id, starts_at);
create index if not exists bookings_user_idx       on bookings (user_id, starts_at);
create index if not exists bookings_checkout_idx   on bookings (checkout_request_id);
create index if not exists bookings_payout_idx     on bookings (payout_month, payout_status);

-- Messages sent through the contact form.
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete set null,
  name       text,
  email      text not null,
  subject    text,
  body       text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_unhandled_idx on contact_messages (handled, created_at desc);

alter table consultants             enable row level security;
alter table consultant_availability enable row level security;
alter table bookings                enable row level security;
alter table contact_messages        enable row level security;

-- ── The monthly payout ledger ───────────────────────────────────────────────
-- What you owe each teacher for a month: their monthly base, plus a fee for
-- every session they delivered. Open this in the Supabase Table Editor on
-- payout day — it is the whole answer to "who do I pay, and how much".
--
-- The base is included on any month where the teacher has unpaid sessions. A
-- teacher owed only the base for a quiet month will not appear here; pay those
-- from the `consultants` table directly until the admin screens land.
create or replace view consultant_payouts_due as
select
  b.payout_month,
  c.id               as consultant_id,
  c.full_name,
  count(*)                                    as sessions,
  sum(b.amount_kes)                           as learners_paid_kes,
  sum(b.platform_fee_kes)                     as orchestra_core_kept_kes,
  sum(b.teacher_fee_kes)                      as session_fees_owed_kes,
  c.monthly_base_kes                          as monthly_base_kes,
  sum(b.teacher_fee_kes) + c.monthly_base_kes as total_owed_kes
from bookings b
join consultants c on c.id = b.consultant_id
where b.status in ('confirmed', 'completed')
  and b.payout_status = 'unpaid'
group by b.payout_month, c.id, c.full_name, c.monthly_base_kes
order by b.payout_month desc, total_owed_kes desc;

-- ── Adding a teacher before the admin screens exist ─────────────────────────
-- Until the teacher portal and admin back office land, approve an applicant by
-- setting their pay and flipping the status here. Pricing is yours to set —
-- the application form never asks an applicant what they want to charge.
--
--   update consultants set
--     status           = 'approved',
--     hourly_rate_kes  = 1500,   -- what the learner pays per hour
--     session_fee_kes  = 900,    -- what this teacher earns per session
--     monthly_base_kes = 5000,   -- their retainer
--     verified_at      = now(),
--     documents_received = true
--   where slug = 'jane-mwangi';
--
--   insert into consultant_availability (consultant_id, weekday, start_minute, end_minute)
--   select id, 2, 9*60, 17*60 from consultants where slug = 'jane-mwangi';
--   -- weekday: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat; minutes from midnight EAT

-- ============================================================================
-- SESSION LIFECYCLE, CANCELLATIONS AND REFUNDS
-- Added September 2026. Safe to re-run.
--
-- The rule everything below serves: if the teaching did not happen, the learner
-- should not be out of pocket, and nobody should be paid for delivering it.
-- A refund to the learner and a voided payout are therefore two halves of the
-- same event and must always move together.
-- ============================================================================

-- `bookings.status` values, in full:
--   pending_payment  the M-Pesa prompt is out, nothing settled
--   confirmed        paid, upcoming
--   completed        taught, teacher is owed
--   cancelled        called off before it happened (see cancelled_by)
--   no_show_teacher  learner turned up, teacher did not  -> refund, void payout
--   no_show_learner  teacher turned up, learner did not  -> no refund, teacher paid
--   disputed         the two sides disagree; a human decides
--   failed           payment never completed
alter table bookings add column if not exists completed_at     timestamptz;
alter table bookings add column if not exists cancelled_at     timestamptz;
alter table bookings add column if not exists cancelled_by     text;   -- learner | teacher | admin
alter table bookings add column if not exists reported_by      text;   -- learner | teacher
alter table bookings add column if not exists reported_at      timestamptz;
alter table bookings add column if not exists report_note      text;
alter table bookings add column if not exists resolution_note  text;

-- Refunds. `refund_status`:
--   none | requested | approved | paid | declined
-- 'approved' means it is owed; 'paid' means the money actually went back, and
-- refund_reference holds the M-Pesa code so it can be reconciled later.
alter table bookings add column if not exists refund_status     text not null default 'none';
alter table bookings add column if not exists refund_amount_kes integer;
alter table bookings add column if not exists refund_reason     text;
alter table bookings add column if not exists refund_reference  text;
alter table bookings add column if not exists refunded_at       timestamptz;

-- payout_status gains 'void' — a session that was refunded or never delivered
-- must stop appearing as money owed to the teacher.
--   unpaid | paid | void
alter table bookings add column if not exists payout_voided_reason text;

create index if not exists bookings_refund_idx on bookings (refund_status)
  where refund_status in ('requested', 'approved');
create index if not exists bookings_status_time_idx on bookings (status, starts_at);

-- ── Payout ledger, corrected for the above ──────────────────────────────────
-- Only sessions that were actually delivered and are still owed. A voided
-- payout (teacher no-show, teacher cancellation, refunded session) drops out
-- here automatically, which is the whole point of having the state.
create or replace view consultant_payouts_due as
select
  b.payout_month,
  c.id               as consultant_id,
  c.full_name,
  count(*)                                    as sessions,
  sum(b.amount_kes)                           as learners_paid_kes,
  sum(b.platform_fee_kes)                     as orchestra_core_kept_kes,
  sum(b.teacher_fee_kes)                      as session_fees_owed_kes,
  c.monthly_base_kes                          as monthly_base_kes,
  sum(b.teacher_fee_kes) + c.monthly_base_kes as total_owed_kes
from bookings b
join consultants c on c.id = b.consultant_id
where b.status in ('completed', 'no_show_learner')
  and b.payout_status = 'unpaid'
group by b.payout_month, c.id, c.full_name, c.monthly_base_kes
order by b.payout_month desc, total_owed_kes desc;

-- ── Refunds you owe ─────────────────────────────────────────────────────────
-- Approved but not yet sent. This is a debt to a customer: clear it fast, it is
-- the single thing most likely to turn one bad session into a public complaint.
create or replace view refunds_due as
select
  b.ref,
  b.refund_amount_kes,
  b.refund_reason,
  b.status          as booking_status,
  b.starts_at,
  b.phone           as refund_to_phone,
  u.email           as learner_email,
  c.full_name       as consultant
from bookings b
join users u       on u.id = b.user_id
join consultants c on c.id = b.consultant_id
where b.refund_status = 'approved'
order by b.starts_at asc;

-- ── Sessions needing a human ────────────────────────────────────────────────
-- Past sessions nobody has resolved, plus anything disputed.
create or replace view sessions_needing_attention as
select
  b.ref,
  b.status,
  b.starts_at,
  b.duration_minutes,
  b.report_note,
  u.email     as learner_email,
  c.full_name as consultant
from bookings b
join users u       on u.id = b.user_id
join consultants c on c.id = b.consultant_id
where b.status = 'disputed'
   or (b.status = 'confirmed'
       and b.starts_at + (b.duration_minutes || ' minutes')::interval < now() - interval '48 hours')
order by b.starts_at asc;
