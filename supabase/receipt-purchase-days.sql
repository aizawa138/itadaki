-- Distinct purchase-day pagination for receipts (Pacific/Auckland calendar days)
-- Run in Supabase SQL editor.

create or replace function public.count_distinct_purchase_days()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::bigint
  from (
    select distinct (purchased_at at time zone 'Pacific/Auckland')::date as d
    from public.receipts
    where user_id = auth.uid()
      and purchased_at is not null
  ) t;
$$;

create or replace function public.get_distinct_purchase_day_at_page(
  p_page int,
  p_page_size int default 1
)
returns date
language sql
stable
security invoker
set search_path = public
as $$
  select d
  from (
    select distinct (purchased_at at time zone 'Pacific/Auckland')::date as d
    from public.receipts
    where user_id = auth.uid()
      and purchased_at is not null
  ) t
  order by d desc
  limit greatest(p_page_size, 1)
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$;

grant execute on function public.count_distinct_purchase_days() to authenticated;
grant execute on function public.get_distinct_purchase_day_at_page(int, int) to authenticated;
