create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint direct_conversations_distinct_users check (user_a <> user_b),
  constraint direct_conversations_canonical_order check (user_a::text < user_b::text),
  constraint direct_conversations_unique_pair unique (user_a, user_b)
);

create index if not exists direct_conversations_user_a_idx on public.direct_conversations(user_a);
create index if not exists direct_conversations_user_b_idx on public.direct_conversations(user_b);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint direct_messages_body_length check (char_length(btrim(body)) between 1 and 4000)
);
create index if not exists direct_messages_conversation_created_idx on public.direct_messages(conversation_id, created_at desc);
create index if not exists direct_messages_sender_idx on public.direct_messages(sender_id);

create table if not exists public.message_read_state (
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid not null references public.direct_messages(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint message_reports_reason_length check (char_length(reason) between 2 and 80),
  constraint message_reports_details_length check (char_length(details) <= 1000),
  constraint message_reports_status check (status in ('open','reviewing','resolved','dismissed')),
  constraint message_reports_unique unique (reporter_id, message_id)
);
create index if not exists message_reports_status_idx on public.message_reports(status, created_at desc);

alter table public.direct_conversations enable row level security;
alter table public.user_blocks enable row level security;
alter table public.direct_messages enable row level security;
alter table public.message_read_state enable row level security;
alter table public.message_reports enable row level security;

revoke all on public.direct_conversations, public.user_blocks, public.direct_messages, public.message_read_state, public.message_reports from anon;
grant select, insert on public.direct_conversations to authenticated;
grant select, insert, delete on public.user_blocks to authenticated;
grant select, insert on public.direct_messages to authenticated;
grant select, insert, update on public.message_read_state to authenticated;
grant select, insert on public.message_reports to authenticated;

create policy direct_conversations_select_participant
on public.direct_conversations for select to authenticated
using ((select auth.uid()) in (user_a, user_b));

create policy direct_conversations_insert_allowed
on public.direct_conversations for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select auth.uid()) in (user_a, user_b)
  and user_a::text < user_b::text
  and exists (
    select 1 from public.profiles p
    where p.id = case when user_a = (select auth.uid()) then user_b else user_a end
      and p.profile_visibility = 'platform'
      and p.allow_messages = true
  )
  and not exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a)
  )
);

create policy user_blocks_select_involved
on public.user_blocks for select to authenticated
using ((select auth.uid()) in (blocker_id, blocked_id));

create policy user_blocks_insert_own
on public.user_blocks for insert to authenticated
with check (blocker_id = (select auth.uid()) and blocked_id <> (select auth.uid()));

create policy user_blocks_delete_own
on public.user_blocks for delete to authenticated
using (blocker_id = (select auth.uid()));

create policy direct_messages_select_participant
on public.direct_messages for select to authenticated
using (
  exists (
    select 1 from public.direct_conversations c
    where c.id = conversation_id
      and (select auth.uid()) in (c.user_a, c.user_b)
  )
);

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
  )
);

create policy message_read_state_select_own
on public.message_read_state for select to authenticated
using (user_id = (select auth.uid()));

create policy message_read_state_insert_own
on public.message_read_state for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.direct_conversations c
    where c.id = conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
  )
);

create policy message_read_state_update_own
on public.message_read_state for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy message_reports_select_own
on public.message_reports for select to authenticated
using (reporter_id = (select auth.uid()));

create policy message_reports_insert_own_visible_message
on public.message_reports for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and status = 'open'
  and exists (
    select 1 from public.direct_messages m
    join public.direct_conversations c on c.id = m.conversation_id
    where m.id = message_id
      and (select auth.uid()) in (c.user_a, c.user_b)
      and m.sender_id <> (select auth.uid())
  )
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_messages'
     ) then
    execute 'alter publication supabase_realtime add table public.direct_messages';
  end if;
end $$;
