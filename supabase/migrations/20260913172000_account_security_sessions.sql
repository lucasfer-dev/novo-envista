create or replace function public.list_my_auth_sessions()
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
  where s.user_id = auth.uid()
    and (s.not_after is null or s.not_after > now())
  order by coalesce(s.updated_at, s.created_at) desc;
$$;

revoke all on function public.list_my_auth_sessions() from public;
revoke all on function public.list_my_auth_sessions() from anon;
grant execute on function public.list_my_auth_sessions() to authenticated;

comment on function public.list_my_auth_sessions() is
  'Returns only the authenticated user sessions needed by the account security UI.';
