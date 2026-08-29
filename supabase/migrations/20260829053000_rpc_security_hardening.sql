-- Final RPC/privilege hardening before public launch.

-- This inbox aggregate does not need elevated privileges. RLS on conversations,
-- messages and read-state already scopes every row to the signed-in participant.
create or replace function public.get_message_threads()
returns table(
  id uuid,
  target_id uuid,
  created_at timestamptz,
  last_body text,
  last_at timestamptz,
  unread_count bigint
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with mine as (
    select
      c.id,
      c.created_at,
      case when c.user_a = auth.uid() then c.user_b else c.user_a end as target_id
    from public.direct_conversations c
    where auth.uid() in (c.user_a, c.user_b)
  ), summarized as (
    select
      c.id,
      c.target_id,
      c.created_at,
      last_message.body as last_body,
      last_message.created_at as last_message_at,
      coalesce(read_state.last_read_at, '-infinity'::timestamptz) as last_read_at
    from mine c
    left join lateral (
      select m.body, m.created_at
      from public.direct_messages m
      where m.conversation_id = c.id
      order by m.created_at desc, m.id desc
      limit 1
    ) last_message on true
    left join public.message_read_state read_state
      on read_state.conversation_id = c.id
     and read_state.user_id = auth.uid()
  )
  select
    s.id,
    s.target_id,
    s.created_at,
    s.last_body,
    coalesce(s.last_message_at, s.created_at) as last_at,
    (
      select count(*)
      from public.direct_messages message
      where message.conversation_id = s.id
        and message.sender_id <> auth.uid()
        and message.created_at > s.last_read_at
    )::bigint as unread_count
  from summarized s
  order by coalesce(s.last_message_at, s.created_at) desc, s.id desc;
$$;

revoke all on function public.get_message_threads() from public, anon;
grant execute on function public.get_message_threads() to authenticated;

-- Trigger entrypoints are invoked by PostgreSQL itself and must not be directly
-- callable by an application JWT.
revoke all on function private.team_after_insert() from public, anon, authenticated;
revoke all on function private.team_invitation_transition() from public, anon, authenticated;

comment on function public.admin_product_metrics() is
  'Intentional SECURITY DEFINER aggregate. Performs explicit admin_memberships authorization and returns counts only; it does not return user-level rows or private message content.';
