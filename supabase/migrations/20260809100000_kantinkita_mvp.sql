-- KantinKita MVP schema.
-- Apply this migration only to a dedicated KantinKita Supabase project.
-- The connected Supabase project in the development workspace belongs to another app.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('super_admin', 'manager', 'cashier', 'stock', 'finance', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.profile_status as enum ('pending', 'active', 'inactive', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.shift_status as enum ('open', 'closed', 'review');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sale_status as enum ('paid', 'voided', 'refunded', 'partially_refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('cash', 'qris_manual', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.stock_movement_type as enum ('purchase', 'sale', 'waste', 'adjustment', 'transfer', 'refund', 'opening_balance');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.purchase_order_status as enum ('draft', 'submitted', 'partially_received', 'received', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.refund_status as enum ('requested', 'approved', 'rejected', 'processed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expense_status as enum ('submitted', 'approved', 'rejected', 'voided');
exception when duplicate_object then null;
end $$;

create sequence if not exists public.sale_no_seq;

create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  location text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null default '',
  employee_code text unique,
  role public.app_role not null default 'viewer',
  status public.profile_status not null default 'pending',
  default_outlet_id uuid references public.outlets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outlet_memberships (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, outlet_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  sku text not null,
  name text not null,
  unit text not null default 'pcs',
  qty_on_hand numeric(14, 3) not null default 0 check (qty_on_hand >= 0),
  min_stock numeric(14, 3) not null default 0 check (min_stock >= 0),
  avg_cost numeric(14, 2) not null default 0 check (avg_cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, sku)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  sku text not null,
  barcode text,
  name text not null,
  sell_price numeric(14, 2) not null check (sell_price >= 0),
  cost_reference numeric(14, 2) not null default 0 check (cost_reference >= 0),
  unit text not null default 'pcs',
  track_stock boolean not null default true,
  favorite boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, sku),
  unique (outlet_id, barcode)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  order_no text not null,
  status public.purchase_order_status not null default 'draft',
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  tax_total numeric(14, 2) not null default 0 check (tax_total >= 0),
  total numeric(14, 2) not null default 0 check (total >= 0),
  expected_at timestamptz,
  received_at timestamptz,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, order_no)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  qty_ordered numeric(14, 3) not null check (qty_ordered > 0),
  qty_received numeric(14, 3) not null default 0 check (qty_received >= 0 and qty_received <= qty_ordered),
  unit_cost numeric(14, 2) not null check (unit_cost >= 0),
  line_total numeric(14, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  cashier_id uuid not null references public.profiles(id) on delete restrict,
  status public.shift_status not null default 'open',
  opening_cash numeric(14, 2) not null default 0 check (opening_cash >= 0),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  counted_cash numeric(14, 2),
  expected_cash numeric(14, 2),
  variance numeric(14, 2),
  close_note text,
  unique (cashier_id, status)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_no text not null unique,
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  shift_id uuid not null references public.shifts(id) on delete restrict,
  cashier_id uuid not null references public.profiles(id) on delete restrict,
  client_transaction_id text not null unique,
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  discount_total numeric(14, 2) not null default 0 check (discount_total >= 0),
  total numeric(14, 2) not null check (total >= 0),
  status public.sale_status not null default 'paid',
  sold_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  qty numeric(14, 3) not null check (qty > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  unit_cost_snapshot numeric(14, 2) not null default 0 check (unit_cost_snapshot >= 0),
  discount numeric(14, 2) not null default 0 check (discount >= 0),
  line_total numeric(14, 2) not null check (line_total >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  method public.payment_method not null,
  amount numeric(14, 2) not null check (amount >= 0),
  reference_no text,
  paid_at timestamptz not null default now()
);

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  requested_amount numeric(14, 2) not null check (requested_amount > 0),
  reason text not null,
  status public.refund_status not null default 'requested',
  requested_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  type public.stock_movement_type not null,
  qty_delta numeric(14, 3) not null check (qty_delta <> 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete restrict,
  type text not null check (type in ('cash_in', 'cash_out')),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null,
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete restrict,
  shift_id uuid references public.shifts(id) on delete set null,
  category text not null,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  status public.expense_status not null default 'submitted',
  receipt_path text,
  spent_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  scope_type text not null default 'global' check (scope_type in ('global', 'outlet')),
  scope_id uuid references public.outlets(id) on delete cascade,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists products_outlet_active_idx on public.products (outlet_id, active);
create index if not exists sales_outlet_sold_at_idx on public.sales (outlet_id, sold_at desc);
create index if not exists sales_shift_idx on public.sales (shift_id);
create index if not exists stock_movements_item_created_idx on public.stock_movements (inventory_item_id, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists purchase_orders_outlet_created_idx on public.purchase_orders (outlet_id, created_at desc);
create index if not exists purchase_order_items_order_idx on public.purchase_order_items (purchase_order_id);
create index if not exists refund_requests_outlet_created_idx on public.refund_requests (outlet_id, created_at desc);
create index if not exists expenses_outlet_spent_idx on public.expenses (outlet_id, spent_at desc);

create schema if not exists private;

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'active'
  );
$$;

create or replace function private.has_any_role(allowed public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(private.current_app_role() = any(allowed), false);
$$;

create or replace function private.can_access_outlet(target_outlet uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.has_any_role(array['super_admin']::public.app_role[])
    or exists (
      select 1 from public.outlet_memberships
      where profile_id = (select auth.uid()) and outlet_id = target_outlet
    );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

alter table public.outlets enable row level security;
alter table public.profiles enable row level security;
alter table public.outlet_memberships enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.products enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.shifts enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.refund_requests enable row level security;
alter table public.stock_movements enable row level security;
alter table public.cash_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

create policy profiles_self_or_admin_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]));

create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (private.has_any_role(array['super_admin', 'manager']::public.app_role[]))
  with check (private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

create policy outlet_membership_self_or_admin_select on public.outlet_memberships
  for select to authenticated
  using (profile_id = (select auth.uid()) or private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]));

create policy outlets_accessible_select on public.outlets
  for select to authenticated
  using (private.is_active_user() and (private.has_any_role(array['super_admin']::public.app_role[]) or private.can_access_outlet(id)));

create policy outlets_admin_write on public.outlets
  for all to authenticated
  using (private.has_any_role(array['super_admin']::public.app_role[]))
  with check (private.has_any_role(array['super_admin']::public.app_role[]));

create policy categories_accessible_select on public.categories
  for select to authenticated
  using (private.is_active_user() and private.can_access_outlet(outlet_id));

create policy categories_manager_write on public.categories
  for all to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

create policy suppliers_accessible_select on public.suppliers
  for select to authenticated
  using (private.is_active_user() and private.can_access_outlet(outlet_id));

create policy suppliers_manager_or_stock_write on public.suppliers
  for all to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy products_accessible_select on public.products
  for select to authenticated
  using (private.is_active_user() and private.can_access_outlet(outlet_id));

create policy products_manager_write on public.products
  for all to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[]));

create policy purchase_orders_accessible_select on public.purchase_orders
  for select to authenticated
  using (private.is_active_user() and private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock', 'finance']::public.app_role[]));

create policy purchase_orders_manager_or_stock_write on public.purchase_orders
  for all to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy purchase_order_items_accessible_select on public.purchase_order_items
  for select to authenticated
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id
      and private.can_access_outlet(po.outlet_id)
      and private.has_any_role(array['super_admin', 'manager', 'stock', 'finance']::public.app_role[])
  ));

create policy purchase_order_items_manager_or_stock_write on public.purchase_order_items
  for all to authenticated
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

create policy inventory_accessible_select on public.inventory_items
  for select to authenticated
  using (private.is_active_user() and private.can_access_outlet(outlet_id));

create policy inventory_manager_or_stock_write on public.inventory_items
  for all to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy shifts_cashier_or_supervisor_select on public.shifts
  for select to authenticated
  using (cashier_id = (select auth.uid()) or (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[])));

create policy shifts_cashier_insert on public.shifts
  for insert to authenticated
  with check (cashier_id = (select auth.uid()) and private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'cashier']::public.app_role[]));

create policy shifts_cashier_or_manager_update on public.shifts
  for update to authenticated
  using ((cashier_id = (select auth.uid()) and status = 'open') or (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager']::public.app_role[])))
  with check (private.can_access_outlet(outlet_id));

create policy sales_accessible_select on public.sales
  for select to authenticated
  using (cashier_id = (select auth.uid()) or (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[])));

create policy sales_authorized_insert on public.sales
  for insert to authenticated
  with check (cashier_id = (select auth.uid()) and private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'cashier']::public.app_role[]));

create policy sale_items_accessible_select on public.sale_items
  for select to authenticated
  using (exists (select 1 from public.sales s where s.id = sale_id and private.can_access_outlet(s.outlet_id) and (s.cashier_id = (select auth.uid()) or private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]))));

create policy payments_accessible_select on public.payments
  for select to authenticated
  using (exists (select 1 from public.sales s where s.id = sale_id and private.can_access_outlet(s.outlet_id) and (s.cashier_id = (select auth.uid()) or private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]))));

create policy refund_requests_accessible_select on public.refund_requests
  for select to authenticated
  using (private.is_active_user() and private.can_access_outlet(outlet_id) and (requested_by = (select auth.uid()) or private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[])));

create policy refund_requests_cashier_insert on public.refund_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and private.can_access_outlet(outlet_id)
    and private.has_any_role(array['super_admin', 'manager', 'cashier']::public.app_role[])
    and exists (select 1 from public.sales s where s.id = public.refund_requests.sale_id and s.outlet_id = public.refund_requests.outlet_id and s.status in ('paid', 'partially_refunded'))
  );

create policy refund_requests_manager_update on public.refund_requests
  for update to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]));

create policy stock_movements_accessible_select on public.stock_movements
  for select to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock', 'finance']::public.app_role[]));

create policy stock_movements_authorized_insert on public.stock_movements
  for insert to authenticated
  with check (created_by = (select auth.uid()) and private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'stock']::public.app_role[]));

create policy cash_movements_accessible_select on public.cash_movements
  for select to authenticated
  using (exists (select 1 from public.shifts s where s.id = shift_id and (s.cashier_id = (select auth.uid()) or private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]))));

create policy cash_movements_cashier_insert on public.cash_movements
  for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (select 1 from public.shifts s where s.id = shift_id and s.cashier_id = (select auth.uid()) and s.status = 'open'));

create policy expenses_accessible_select on public.expenses
  for select to authenticated
  using (private.is_active_user() and private.can_access_outlet(outlet_id) and (created_by = (select auth.uid()) or private.has_any_role(array['super_admin', 'manager', 'finance', 'viewer']::public.app_role[])));

create policy expenses_cashier_or_finance_insert on public.expenses
  for insert to authenticated
  with check (created_by = (select auth.uid()) and private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'cashier', 'finance']::public.app_role[]));

create policy expenses_manager_or_finance_update on public.expenses
  for update to authenticated
  using (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]))
  with check (private.can_access_outlet(outlet_id) and private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]));

create policy audit_logs_supervisor_select on public.audit_logs
  for select to authenticated
  using (private.has_any_role(array['super_admin', 'manager', 'finance', 'viewer']::public.app_role[]));

create policy app_settings_supervisor_select on public.app_settings
  for select to authenticated
  using (private.has_any_role(array['super_admin', 'manager', 'finance']::public.app_role[]) and (scope_type = 'global' or private.can_access_outlet(scope_id)));

create policy app_settings_manager_write on public.app_settings
  for all to authenticated
  using (private.has_any_role(array['super_admin', 'manager']::public.app_role[]) and (scope_type = 'global' or private.can_access_outlet(scope_id)))
  with check (private.has_any_role(array['super_admin', 'manager']::public.app_role[]) and (scope_type = 'global' or private.can_access_outlet(scope_id)));

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, status, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'pending', 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

create or replace function private.finalize_sale(
  p_outlet_id uuid,
  p_shift_id uuid,
  p_client_transaction_id text,
  p_items jsonb,
  p_payment_method public.payment_method,
  p_payment_amount numeric,
  p_reference_no text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_shift public.shifts%rowtype;
  v_product public.products%rowtype;
  v_sale public.sales%rowtype;
  v_line record;
  v_subtotal numeric(14, 2) := 0;
  v_discount_total numeric(14, 2) := 0;
  v_line_total numeric(14, 2);
  v_sale_no text;
begin
  if not private.is_active_user() then raise exception 'active profile required'; end if;
  if not private.has_any_role(array['super_admin', 'manager', 'cashier']::public.app_role[]) then raise exception 'sale permission denied'; end if;
  if not private.can_access_outlet(p_outlet_id) then raise exception 'outlet permission denied'; end if;

  select * into v_sale from public.sales where client_transaction_id = p_client_transaction_id limit 1;
  if found then
    return jsonb_build_object('sale_id', v_sale.id, 'sale_no', v_sale.sale_no, 'total', v_sale.total);
  end if;

  select * into v_shift
  from public.shifts
  where id = p_shift_id and outlet_id = p_outlet_id and cashier_id = (select auth.uid()) and status = 'open'
  for update;
  if not found then raise exception 'open cashier shift required'; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'sale must contain items'; end if;

  for v_line in select * from jsonb_to_recordset(p_items) as x(product_id uuid, quantity numeric, discount numeric) loop
    if v_line.quantity is null or v_line.quantity <= 0 then raise exception 'quantity must be greater than zero'; end if;
    select * into v_product from public.products where id = v_line.product_id and outlet_id = p_outlet_id and active = true for share;
    if not found then raise exception 'product is unavailable'; end if;
    v_line_total := (v_product.sell_price * v_line.quantity) - coalesce(v_line.discount, 0);
    if v_line_total < 0 then raise exception 'line total cannot be negative'; end if;
    v_subtotal := v_subtotal + (v_product.sell_price * v_line.quantity);
    v_discount_total := v_discount_total + coalesce(v_line.discount, 0);
  end loop;

  if round(v_subtotal - v_discount_total, 2) <> round(p_payment_amount, 2) then raise exception 'payment amount does not match total'; end if;

  v_sale_no := 'KNT-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(nextval('public.sale_no_seq')::text, 6, '0');
  insert into public.sales (sale_no, outlet_id, shift_id, cashier_id, client_transaction_id, subtotal, discount_total, total)
  values (v_sale_no, p_outlet_id, p_shift_id, (select auth.uid()), p_client_transaction_id, v_subtotal, v_discount_total, v_subtotal - v_discount_total)
  returning * into v_sale;

  for v_line in select * from jsonb_to_recordset(p_items) as x(product_id uuid, quantity numeric, discount numeric) loop
    select * into v_product from public.products where id = v_line.product_id for share;
    v_line_total := (v_product.sell_price * v_line.quantity) - coalesce(v_line.discount, 0);
    insert into public.sale_items (sale_id, product_id, product_name_snapshot, qty, unit_price, unit_cost_snapshot, discount, line_total)
    values (v_sale.id, v_product.id, v_product.name, v_line.quantity, v_product.sell_price, v_product.cost_reference, coalesce(v_line.discount, 0), v_line_total);

    if v_product.track_stock and v_product.inventory_item_id is not null then
      update public.inventory_items
      set qty_on_hand = qty_on_hand - v_line.quantity, updated_at = now()
      where id = v_product.inventory_item_id and qty_on_hand >= v_line.quantity;
      if not found then raise exception 'insufficient stock for %', v_product.name; end if;
      insert into public.stock_movements (inventory_item_id, outlet_id, type, qty_delta, unit_cost, reference_type, reference_id, reason, created_by)
      values (v_product.inventory_item_id, p_outlet_id, 'sale', -v_line.quantity, v_product.cost_reference, 'sale', v_sale.id, 'POS sale', (select auth.uid()));
    end if;
  end loop;

  insert into public.payments (sale_id, method, amount, reference_no)
  values (v_sale.id, p_payment_method, p_payment_amount, p_reference_no);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_json)
  values ((select auth.uid()), 'sale.finalized', 'sale', v_sale.id, jsonb_build_object('sale_no', v_sale.sale_no, 'total', v_sale.total));

  return jsonb_build_object('sale_id', v_sale.id, 'sale_no', v_sale.sale_no, 'total', v_sale.total);
end;
$$;

revoke all on function private.finalize_sale(uuid, uuid, text, jsonb, public.payment_method, numeric, text) from public;
grant execute on function private.finalize_sale(uuid, uuid, text, jsonb, public.payment_method, numeric, text) to authenticated;

create or replace function public.finalize_sale(
  p_outlet_id uuid,
  p_shift_id uuid,
  p_client_transaction_id text,
  p_items jsonb,
  p_payment_method public.payment_method,
  p_payment_amount numeric,
  p_reference_no text default null
)
returns jsonb
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.finalize_sale($1, $2, $3, $4, $5, $6, $7);
$$;

revoke all on function public.finalize_sale(uuid, uuid, text, jsonb, public.payment_method, numeric, text) from public;
grant execute on function public.finalize_sale(uuid, uuid, text, jsonb, public.payment_method, numeric, text) to authenticated;

create or replace function private.sales_mix(
  p_outlet_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object('label', mix.label, 'amount', mix.amount) order by mix.amount desc), '[]'::jsonb)
  from (
    select coalesce(c.name, 'Lainnya') as label,
           round(sum(si.line_total), 2) as amount
    from public.sale_items si
    join public.sales s on s.id = si.sale_id
    join public.products p on p.id = si.product_id
    left join public.categories c on c.id = p.category_id
    where s.outlet_id = p_outlet_id
      and s.sold_at >= p_from
      and s.sold_at < p_to
      and s.status = 'paid'
      and private.is_active_user()
      and private.can_access_outlet(p_outlet_id)
    group by coalesce(c.name, 'Lainnya')
  ) as mix;
$$;

revoke all on function private.sales_mix(uuid, timestamptz, timestamptz) from public;
grant execute on function private.sales_mix(uuid, timestamptz, timestamptz) to authenticated;

create or replace function public.sales_mix(
  p_outlet_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.sales_mix($1, $2, $3);
$$;

revoke all on function public.sales_mix(uuid, timestamptz, timestamptz) from public;
grant execute on function public.sales_mix(uuid, timestamptz, timestamptz) to authenticated;
