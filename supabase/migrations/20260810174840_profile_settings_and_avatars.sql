-- Self-service profile settings without opening a path to privilege escalation.

alter table public.profiles
  add column if not exists avatar_url text;

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Keep status and every authorization-bearing field outside self-service updates.
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
  if actor_id is null then
    return new;
  end if;

  actor_can_manage := private.can_manage_account_roles();

  if tg_op = 'INSERT' then
    if not actor_can_manage and (
      new.account_role <> 'customer'
      or new.role <> 'viewer'
      or new.status <> 'pending'
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
    or new.status is distinct from old.status
    or new.admin_approved_at is distinct from old.admin_approved_at
    or new.admin_approved_by is distinct from old.admin_approved_by
    or new.employee_code is distinct from old.employee_code
    or new.default_outlet_id is distinct from old.default_outlet_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Akses ditolak: pengguna tidak dapat mengubah hak akses akun.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_customer_admin_escalation on public.profiles;
create trigger prevent_customer_admin_escalation
  before insert or update of account_role, role, status, employee_code,
    admin_approved_at, admin_approved_by, default_outlet_id
  on public.profiles
  for each row execute function private.prevent_customer_admin_escalation();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatar_public_read on storage.objects;
create policy avatar_public_read on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists avatar_owner_insert on storage.objects;
create policy avatar_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatar_owner_update on storage.objects;
create policy avatar_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatar_owner_delete on storage.objects;
create policy avatar_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

comment on column public.profiles.avatar_url is
  'Public URL for the user-managed profile photo stored in the avatars bucket.';
