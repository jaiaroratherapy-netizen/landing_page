-- October 2026 updates. Run once in Supabase → SQL Editor.

-- 1. client status "new" is now "unassigned"
alter table clients drop constraint if exists clients_status_check;
update clients set status = 'unassigned' where status = 'new';
alter table clients alter column status set default 'unassigned';
alter table clients add constraint clients_status_check
  check (status in ('unassigned', 'assigned', 'active', 'paused', 'dropped', 'completed'));

-- 2. remember who was last told about a client's assignment (for reassignment emails)
alter table clients add column if not exists notified_trainee_id uuid references trainees on delete set null;

-- 3. WhatsApp message templates edited by admins (defaults live in the code)
create table if not exists message_templates (
  key text primary key,
  body text not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

-- 4. outgoing email queue (sent from kirana.counselling@gmail.com)
create table if not exists email_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  to_email text,
  subject text,
  html text,
  payload jsonb,
  dedupe_key text,
  send_after timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'cancelled', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_outbox_due_idx on email_outbox (send_after) where status = 'pending';
create unique index if not exists email_outbox_one_pending on email_outbox (dedupe_key) where status = 'pending' and dedupe_key is not null;

alter table message_templates enable row level security;
alter table email_outbox enable row level security;
revoke all on message_templates from anon, authenticated;
revoke all on email_outbox from anon, authenticated;
