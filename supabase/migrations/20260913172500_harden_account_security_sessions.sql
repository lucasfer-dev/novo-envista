create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.list_my_auth_sessions_impl()
returns table (
  session_id uuid,
  created_at timestamptz,
  last_active_at timestamptz,
  user_agent text,
  is_current boolean
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    s.id as session_id,
    s.created_at,
    coalesce(s.updated_at, s.created_at) as last_active_at,
    left(coalesce(s.user_agent, ''), 512) as user_agent,
    s.id::text = coalesce(auth.jwt() ->> 'session_id', '') as is_current
  from auth.sessions as s
  where auth.uid() is not null
    and s.user_id = auth.uid()
    and (s.not_after is null or s.not_after > now())
  order by coalesce(s.updated_at, s.created_at) desc;
$$;

revoke all on function private.list_my_auth_sessions_impl() from public;
revoke all on function private.list_my_auth_sessions_impl() from anon;
grant execute on function private.list_my_auth_sessions_impl() to authenticated;

create or replace function public.list_my_auth_sessions()
returns table (
  session_id uuid,
  created_at timestamptz,
  last_active_at timestamptz,
  user_agent text,
  is_current boolean
)
language sql
security invoker
stable
set search_path = ''
as $$
  select * from private.list_my_auth_sessions_impl();
$$;

revoke all on function public.list_my_auth_sessions() from public;
revoke all on function public.list_my_auth_sessions() from anon;
grant execute on function public.list_my_auth_sessions() to authenticated;

comment on function private.list_my_auth_sessions_impl() is
  'Privileged implementation for reading only the authenticated user own sessions.';
comment on function public.list_my_auth_sessions() is
  'Public RPC wrapper for authenticated users. The privileged implementation lives outside exposed schemas.';
