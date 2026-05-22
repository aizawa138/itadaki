-- Receipt scan jobs table + RLS policies
-- Run this in Supabase SQL editor.

create table if not exists public.receipt_scan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  image_path text not null,
  receipt_id uuid null,
  error_message text null,
  attempt_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_receipt_scan_jobs_updated_at on public.receipt_scan_jobs;
create trigger set_receipt_scan_jobs_updated_at
before update on public.receipt_scan_jobs
for each row execute procedure public.set_updated_at();

-- Permissions (needed when RLS is enabled too)
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.receipt_scan_jobs to authenticated;

-- Worker uses the service role key (bypass RLS but still needs GRANTs)
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.receipt_scan_jobs to service_role;

-- Worker also inserts into receipts/receipt_items and pantry_items
grant select, insert, update, delete on table public.receipts to service_role;
grant select, insert, update, delete on table public.receipt_items to service_role;
grant select, insert, update, delete on table public.pantry_items to service_role;

alter table public.receipt_scan_jobs enable row level security;

-- Users can see only their jobs
drop policy if exists receipt_scan_jobs_select_own on public.receipt_scan_jobs;
create policy receipt_scan_jobs_select_own
on public.receipt_scan_jobs
for select
to authenticated
using (user_id = auth.uid());

-- Users can create jobs only for themselves
drop policy if exists receipt_scan_jobs_insert_own on public.receipt_scan_jobs;
create policy receipt_scan_jobs_insert_own
on public.receipt_scan_jobs
for insert
to authenticated
with check (user_id = auth.uid());

-- Optional: allow users to cancel/delete their own jobs
drop policy if exists receipt_scan_jobs_delete_own on public.receipt_scan_jobs;
create policy receipt_scan_jobs_delete_own
on public.receipt_scan_jobs
for delete
to authenticated
using (user_id = auth.uid());
