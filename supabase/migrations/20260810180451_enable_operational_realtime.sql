-- Enable scoped realtime updates for the operational workspace.
-- RLS remains the authorization boundary for every delivered row.

grant select on public.sales to authenticated;
grant select on public.inventory_items to authenticated;
grant select on public.products to authenticated;
grant select on public.shifts to authenticated;
grant select on public.purchase_orders to authenticated;
grant select on public.refund_requests to authenticated;
grant select on public.stock_movements to authenticated;
grant select on public.cash_movements to authenticated;
grant select on public.expenses to authenticated;
grant select, update on public.profiles to authenticated;

do $$
declare
  realtime_table text;
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  foreach realtime_table in array array[
    'sales',
    'inventory_items',
    'products',
    'shifts',
    'purchase_orders',
    'refund_requests',
    'stock_movements',
    'cash_movements',
    'expenses',
    'profiles'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = realtime_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        realtime_table
      );
    end if;
  end loop;
end;
$$;

comment on publication supabase_realtime is
  'Realtime publication for RLS-filtered KantinKita operational updates.';
