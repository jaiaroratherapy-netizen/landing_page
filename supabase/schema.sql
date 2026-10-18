-- Kirana Counselling EHR + LMS schema.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
-- Every table has RLS on and no policies, so the publishable key can read nothing.
-- All reads/writes happen in Vercel Functions with the secret key after a role check.

create extension if not exists pgcrypto;

create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date,
  ends_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists trainees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null,
  email text not null unique check (email = lower(email)),
  full_name text not null,
  phone text,
  cohort_id uuid references cohorts on delete set null,
  status text not null default 'invited'
    check (status in ('invited', 'onboarded', 'active', 'paused', 'completed')),
  pronouns text,
  languages text,
  qualifications text,
  specialisations text,
  bio text,
  upi_id text,
  emergency_contact text,
  admin_notes text,
  -- public profile (/therapists/<slug>)
  slug text unique,
  photo_url text,
  intro_call_url text,
  city text,
  experience text,
  linkedin text,
  availability jsonb,
  is_public boolean not null default true,
  serene_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null,
  email text not null unique check (email = lower(email)),
  full_name text not null,
  whatsapp text,
  reason text,
  diagnosis text,
  self_harm text,
  org text,
  pref text,
  -- Aadhaar Secure QR result (the raw QR, address and photo are never stored)
  aadhaar_last4 text,
  birth_year int,
  gender text,
  id_hash text unique,
  id_verified_by text,
  mobile_match boolean,
  qr_generated_at text,
  pronouns text,
  emergency_contact text,
  trainee_id uuid references trainees on delete set null,
  assigned_at timestamptz,
  status text not null default 'new'
    check (status in ('new', 'assigned', 'active', 'paused', 'dropped', 'completed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_trainee_idx on clients (trainee_id);

-- unique links: trainee onboarding (sent by admin) and client consent (sent by trainee)
create table if not exists invites (
  token text primary key,
  kind text not null check (kind in ('trainee_onboarding', 'client_consent')),
  trainee_id uuid references trainees on delete cascade,
  client_id uuid references clients on delete cascade,
  created_by text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  used_at timestamptz
);

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('trainee', 'client')),
  trainee_id uuid references trainees on delete cascade,
  client_id uuid references clients on delete cascade,
  invite_token text references invites on delete set null,
  consent_date date not null,
  emergency_contact text not null,
  answers jsonb not null,
  signature text not null,
  signed_at timestamptz not null default now(),
  user_agent text,
  ip text
);
create index if not exists consents_trainee_idx on consents (trainee_id);
create index if not exists consents_client_idx on consents (client_id);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  trainee_id uuid not null references trainees on delete cascade,
  scheduled_at timestamptz not null,
  duration_min int not null default 50,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link text,
  trainee_notes text,
  created_by text,
  cancelled_by text,
  cancel_reason text,
  reschedule_count int not null default 0,
  client_paid boolean not null default false,
  kind text not null default 'session' check (kind in ('intro', 'session')),
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sessions_client_idx on sessions (client_id, scheduled_at);
create index if not exists sessions_trainee_idx on sessions (trainee_id, scheduled_at);
create unique index if not exists sessions_no_double_booking on sessions (trainee_id, scheduled_at) where status = 'scheduled';

create table if not exists google_accounts (
  trainee_id uuid primary key references trainees on delete cascade,
  google_email text,
  refresh_token text not null,
  scope text,
  connected_at timestamptz not null default now(),
  last_error text
);

-- trainee's tracking sheet for each client
create table if not exists client_tracking (
  client_id uuid primary key references clients on delete cascade,
  trainee_id uuid references trainees on delete set null,
  intro_call boolean,
  first_session boolean,
  first_session_feedback text,
  sessions_taken int,
  dropped_out boolean,
  dropout_reason text,
  dropout_after int,
  overall_feedback text,
  private_practice boolean,
  private_price int,
  updated_at timestamptz not null default now()
);

-- trainee → Kirana (admin only)
create table if not exists trainee_feedback (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid not null references trainees on delete cascade,
  session_id uuid references sessions on delete set null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

-- client → therapist + Kirana
create table if not exists client_feedback (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  trainee_id uuid references trainees on delete set null,
  session_id uuid unique references sessions on delete set null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

-- money paid out by Kirana to trainees
create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid not null references trainees on delete cascade,
  amount int not null check (amount > 0),
  paid_on date not null default current_date,
  reference text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists activity (
  id bigint generated always as identity primary key,
  actor text,
  action text not null,
  entity text,
  entity_id uuid,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists activity_created_idx on activity (created_at desc);

do $$
declare t text;
begin
  foreach t in array array['cohorts','trainees','clients','invites','consents','sessions',
    'client_tracking','trainee_feedback','client_feedback','payouts','activity','google_accounts']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from anon, authenticated', t);
  end loop;
end $$;
