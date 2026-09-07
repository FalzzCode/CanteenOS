-- KantinKita account roles
-- Apply after 20260809100000_kantinkita_mvp.sql.
-- Authorization stays in database-owned profile data; browser metadata is display-only.

do $$ begin
  create type public.account_role as enum ('admin', 'customer');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists account_role public.account_role;

-- Existing operational profiles are preserved as admin accounts. New auth users are
-- forced to customer by the trigger below and must be provisioned separately as admins.
update public.profiles
set account_role = 'admin'
where account_role is null;

alter table public.profiles
  alter column account_role set default 'admin',
  alter column account_role set not null;

alter table public.profiles
  add column if not exists admin_approved_at timestamptz,
  add column if not exists admin_approved_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_account_role_status_idx
  on public.profiles (account_role, status);

create or replace function private.admin_access_ready()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = (select auth.uid())
      and p.account_role = 'admin'
      and p.status = 'active'
      and coalesce(nullif(trim(p.employee_code), ''), '') <> ''
      and p.admin_approved_at is not null
      and p.default_outlet_id is not null
      and u.email_confirmed_at is not null
  );
$$;
create or replace function private.is_customer_account()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and account_role = 'customer'
      and status = 'active'
  );
$$;

-- Every existing operational RLS policy that calls has_any_role now requires the
-- complete admin gate above. Customers receive only the explicit read policies below.
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
    and private.admin_access_ready()
  limit 1;
$$;

drop policy if exists outlets_customer_select on public.outlets;
create policy outlets_customer_select on public.outlets
  for select to authenticated
  using (private.is_customer_account() and active);

drop policy if exists categories_customer_select on public.categories;
create policy categories_customer_select on public.categories
  for select to authenticated
  using (
    private.is_customer_account()
    and active
    and exists (
      select 1 from public.outlets o
      where o.id = outlet_id and o.active
    )
  );

drop policy if exists products_customer_select on public.products;
create policy products_customer_select on public.products
  for select to authenticated
  using (
    private.is_customer_account()
    and active
    and exists (
      select 1
      from public.outlets o
      where o.id = outlet_id and o.active
    )
    and exists (
      select 1
      from public.categories c
      where c.id = category_id and c.active
    )
  );

-- Self-registration can never create an admin, even when a browser sends a forged
-- role field in raw_user_meta_data. full_name is only a display value.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, status, role, account_role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    'active',
    'viewer',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();
