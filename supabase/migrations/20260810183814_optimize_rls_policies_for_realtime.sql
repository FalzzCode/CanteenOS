-- Keep exactly one permissive policy per role/action where possible.
-- This reduces repeated RLS evaluations for REST queries and Realtime events
-- without changing the effective admin, employee, or customer access model.

drop policy if exists outlets_accessible_select on public.outlets;
drop policy if exists outlets_customer_select on public.outlets;
drop policy if exists outlets_admin_write on public.outlets;

create policy outlets_authorized_select on public.outlets
  for select to authenticated
  using (
    (
      private.is_active_user()
      and (
        private.has_any_role(array['super_admin']::public.app_role[])
        or private.can_access_outlet(id)
      )
    )
    or (private.is_customer_account() and active)
  );

create policy outlets_admin_insert on public.outlets
  for insert to authenticated
  with check (private.has_any_role(array['super_admin']::public.app_role[]));

create policy outlets_admin_update on public.outlets
  for update to authenticated
  using (private.has_any_role(array['super_admin']::public.app_role[]))
  with check (private.has_any_role(array['super_admin']::public.app_role[]));

create policy outlets_admin_delete on public.outlets
  for delete to authenticated
  using (private.has_any_role(array['super_admin']::public.app_role[]));

drop policy if exists categories_accessible_select on public.categories;
drop policy if exists categories_customer_select on public.categories;
drop policy if exists categories_manager_write on public.categories;

create policy categories_authorized_select on public.categories
  for select to authenticated
  using (
    (private.is_active_user() and private.can_access_outlet(outlet_id))
    or (
      private.is_customer_account()
      and active
      and exists (
        select 1 from public.outlets o
        where o.id = outlet_id and o.active
      )
    )
  );

create policy categories_manager_insert on public.categories
  for insert to authenticated
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

create policy categories_manager_update on public.categories
  for update to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

create policy categories_manager_delete on public.categories
  for delete to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

drop policy if exists products_accessible_select on public.products;
drop policy if exists products_customer_select on public.products;
drop policy if exists products_manager_write on public.products;

create policy products_authorized_select on public.products
  for select to authenticated
  using (
    (private.is_active_user() and private.can_access_outlet(outlet_id))
    or (
      private.is_customer_account()
      and active
      and exists (
        select 1 from public.outlets o
        where o.id = outlet_id and o.active
      )
      and exists (
        select 1 from public.categories c
        where c.id = category_id and c.active
      )
    )
  );

create policy products_manager_insert on public.products
  for insert to authenticated
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

create policy products_manager_update on public.products
  for update to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

create policy products_manager_delete on public.products
  for delete to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

drop policy if exists suppliers_manager_or_stock_write on public.suppliers;

create policy suppliers_manager_or_stock_insert on public.suppliers
  for insert to authenticated
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy suppliers_manager_or_stock_update on public.suppliers
  for update to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy suppliers_manager_or_stock_delete on public.suppliers
  for delete to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

drop policy if exists inventory_manager_or_stock_write on public.inventory_items;

create policy inventory_manager_or_stock_insert on public.inventory_items
  for insert to authenticated
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy inventory_manager_or_stock_update on public.inventory_items
  for update to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy inventory_manager_or_stock_delete on public.inventory_items
  for delete to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

drop policy if exists purchase_orders_manager_or_stock_write on public.purchase_orders;

create policy purchase_orders_manager_or_stock_insert on public.purchase_orders
  for insert to authenticated
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy purchase_orders_manager_or_stock_update on public.purchase_orders
  for update to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy purchase_orders_manager_or_stock_delete on public.purchase_orders
  for delete to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

drop policy if exists purchase_order_items_manager_or_stock_write on public.purchase_order_items;

create policy purchase_order_items_manager_or_stock_insert on public.purchase_order_items
  for insert to authenticated
  with check (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
      and private.can_access_outlet(po.outlet_id)
      and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[])
  ));

create policy purchase_order_items_manager_or_stock_update on public.purchase_order_items
  for update to authenticated
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
      and private.can_access_outlet(po.outlet_id)
      and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[])
  ))
  with check (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
      and private.can_access_outlet(po.outlet_id)
      and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[])
  ));

create policy purchase_order_items_manager_or_stock_delete on public.purchase_order_items
  for delete to authenticated
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
      and private.can_access_outlet(po.outlet_id)
      and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[])
  ));

drop policy if exists app_settings_manager_write on public.app_settings;

create policy app_settings_manager_insert on public.app_settings
  for insert to authenticated
  with check (private.has_any_role(array['super_admin', 'manager']::public.app_role[]) and (scope_type = 'global' or private.can_access_outlet(scope_id)));

create policy app_settings_manager_update on public.app_settings
  for update to authenticated
  using (private.has_any_role(array['super_admin', 'manager']::public.app_role[]) and (scope_type = 'global' or private.can_access_outlet(scope_id)))
  with check (private.has_any_role(array['super_admin', 'manager']::public.app_role[]) and (scope_type = 'global' or private.can_access_outlet(scope_id)));

create policy app_settings_manager_delete on public.app_settings
  for delete to authenticated
  using (private.has_any_role(array['super_admin', 'manager']::public.app_role[]) and (scope_type = 'global' or private.can_access_outlet(scope_id)));

drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_self_update on public.profiles;

create policy profiles_authorized_update on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or private.has_any_role(array['super_admin', 'manager']::public.app_role[])
  )
  with check (
    id = (select auth.uid())
    or private.has_any_role(array['super_admin', 'manager']::public.app_role[])
  );
