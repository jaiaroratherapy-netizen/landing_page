-- In-app booking + Google Calendar sync. Run once in Supabase → SQL Editor.
alter table sessions add column if not exists kind text not null default 'session';
alter table sessions drop constraint if exists sessions_kind_check;
alter table sessions add constraint sessions_kind_check check (kind in ('intro', 'session'));
alter table sessions add column if not exists google_event_id text;
-- one booking per therapist per start time
create unique index if not exists sessions_no_double_booking on sessions (trainee_id, scheduled_at) where status = 'scheduled';

-- trainees' Google Calendar connections (refresh tokens never leave the server)
create table if not exists google_accounts (
  trainee_id uuid primary key references trainees on delete cascade,
  google_email text,
  refresh_token text not null,
  scope text,
  connected_at timestamptz not null default now(),
  last_error text
);
alter table google_accounts enable row level security;
revoke all on google_accounts from anon, authenticated;

-- intro calls are booked inside Kirana now
update trainees set intro_call_url = null where intro_call_url is not null;
