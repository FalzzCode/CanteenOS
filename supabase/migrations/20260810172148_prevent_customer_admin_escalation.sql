-- Prevent customer accounts from escalating themselves into operational admins.
-- The profiles table is the authorization source of truth; raw_user_meta_data is
-- intentionally ignored because Supabase users can edit it themselves.

alter table public.profiles
  alter column account_role set default 'customer';

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
  );
$$;

create or replace function private.prevent_customer_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_can_manage boolean := false;
begin
  -- SQL migrations and service-side provisioning do not carry an end-user uid.
  -- Authenticated browser requests always do and must pass the role-manager gate.
  if actor_id is null then
    return new;
  end if;

  actor_can_manage := private.can_manage_account_roles();

  if tg_op = 'INSERT' then
    if not actor_can_manage and (
      new.account_role <> 'customer'
      or new.role <> 'viewer'
      or new.admin_approved_at is not null
      or new.admin_approved_by is not null
      or new.employee_code is not null
    ) then
      raise exception using
        errcode = '42501',
        message = 'Akses ditolak: pelanggan tidak dapat membuat akun admin.';
    end if;

    return new;
  end if;

  if not actor_can_manage and (
    new.account_role is distinct from old.account_role
    or new.role is distinct from old.role
    or new.admin_approved_at is distinct from old.admin_approved_at
    or new.admin_approved_by is distinct from old.admin_approved_by
    or new.employee_code is distinct from old.employee_code
    or new.default_outlet_id is distinct from old.default_outlet_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Akses ditolak: pelanggan tidak dapat mengubah hak akses admin.';
  end if;

  return new;
end;
$$;

revoke all on function private.can_manage_account_roles() from public, anon, authenticated;
revoke all on function private.prevent_customer_admin_escalation() from public, anon, authenticated;

drop trigger if exists prevent_customer_admin_escalation on public.profiles;
create trigger prevent_customer_admin_escalation
  before insert or update of account_role, role, employee_code,
    admin_approved_at, admin_approved_by, default_outlet_id
  on public.profiles
  for each row execute function private.prevent_customer_admin_escalation();

comment on function private.prevent_customer_admin_escalation() is
  'Rejects authenticated role escalation unless the actor is an approved manager or super admin.';
