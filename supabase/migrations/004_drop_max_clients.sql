-- No client limit per trainee. Run once in Supabase → SQL Editor.
alter table trainees drop column if exists max_clients;
