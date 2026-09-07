-- Google OAuth is a customer entry point. Admin accounts must use the
-- school-managed email/password flow, even if a profile is later provisioned
-- incorrectly as an admin.
-- The provider value comes from auth.users.raw_app_meta_data, which is owned by
-- Supabase. raw_user_meta_data is intentionally not used for authorization.

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
      and coalesce(u.raw_app_meta_data ->> 'provider', '') <> 'google'
  );
$$;

create or replace function private.can_manage_account_roles()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = (select auth.uid())
      and p.account_role = 'admin'
      and p.role in ('super_admin', 'manager')
      and p.status = 'active'
      and coalesce(nullif(btrim(p.employee_code), ''), '') <> ''
      and p.admin_approved_at is not null
      and p.default_outlet_id is not null
      and u.email_confirmed_at is not null
      and coalesce(u.raw_app_meta_data ->> 'provider', '') <> 'google'
  );
$$;

revoke all on function private.admin_access_ready() from public, anon, authenticated;
revoke all on function private.can_manage_account_roles() from public, anon, authenticated;

comment on function private.admin_access_ready() is
  'Allows only active, approved, complete email admins into operational RLS; Google OAuth accounts remain customer-only.';
