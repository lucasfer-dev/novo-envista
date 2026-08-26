drop policy if exists direct_messages_insert_participant on public.direct_messages;

create policy direct_messages_insert_participant
on public.direct_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.direct_conversations c
    where c.id = conversation_id
      and (select auth.uid()) in (c.user_a, c.user_b)
      and not exists (
        select 1 from public.user_blocks b
        where (b.blocker_id = c.user_a and b.blocked_id = c.user_b)
           or (b.blocker_id = c.user_b and b.blocked_id = c.user_a)
      )
      and exists (
        select 1 from public.profiles p
        where p.id = case when c.user_a = (select auth.uid()) then c.user_b else c.user_a end
          and p.profile_visibility = 'platform'
          and p.allow_messages = true
      )
  )
);
