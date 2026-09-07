-- Customers may see availability for active menu items, but never the whole inventory table.
-- Admin access remains outlet-scoped through the existing membership checks.

drop policy if exists inventory_accessible_select on public.inventory_items;

create policy inventory_accessible_select on public.inventory_items
  for select to authenticated
  using (
    (
      private.is_active_user()
      and private.can_access_outlet(outlet_id)
    )
    or (
      private.is_customer_account()
      and exists (
        select 1
        from public.products p
        join public.outlets o on o.id = p.outlet_id
        where p.inventory_item_id = inventory_items.id
          and p.active
          and o.active
      )
    )
  );
