create or replace function private.notification_prefix(target_user uuid)
returns text language sql stable security definer set search_path=pg_catalog,public as $$
  select case when p.role='investor' then '/investor' else '' end from public.profiles p where p.id=target_user;
$$;
revoke all on function private.notification_prefix(uuid) from public, anon, authenticated;
