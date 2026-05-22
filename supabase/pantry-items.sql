-- Pantry items: grants + RLS for app + receipt worker
-- Run this in Supabase SQL editor.

grant select, insert, update, delete on table public.pantry_items to authenticated;
grant select, insert, update, delete on table public.pantry_items to service_role;

alter table public.pantry_items enable row level security;

drop policy if exists pantry_items_select_own on public.pantry_items;
create policy pantry_items_select_own
on public.pantry_items
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists pantry_items_insert_own on public.pantry_items;
create policy pantry_items_insert_own
on public.pantry_items
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists pantry_items_update_own on public.pantry_items;
create policy pantry_items_update_own
on public.pantry_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists pantry_items_delete_own on public.pantry_items;
create policy pantry_items_delete_own
on public.pantry_items
for delete
to authenticated
using (user_id = auth.uid());
