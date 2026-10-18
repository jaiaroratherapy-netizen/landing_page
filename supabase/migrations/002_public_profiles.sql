-- Public therapist profiles. Run once in Supabase → SQL Editor.
alter table trainees add column if not exists slug text unique;
alter table trainees add column if not exists photo_url text;
alter table trainees add column if not exists intro_call_url text;
alter table trainees add column if not exists city text;
alter table trainees add column if not exists experience text;
alter table trainees add column if not exists linkedin text;
alter table trainees add column if not exists availability jsonb;
alter table trainees add column if not exists is_public boolean not null default true;
alter table trainees add column if not exists serene_username text;
