-- Abuse prevention and moderation hardening.
-- Quotas here are authoritative for authenticated writes even when a client
-- bypasses the Next.js UI and talks directly to the Supabase Data API.

create schema if not exists private;

create table if not exists private.write_rate_limits (
  actor_id uuid not null,
  scope text not null,
  window_start timestamptz not null,
  hits integer not null default 1 check (hits > 0),
  updated_at timestamptz not null default statement_timestamp(),
  primary key (actor_id, scope, window_start)
);

revoke all on table private.write_rate_limits from public, anon, authenticated;

create or replace function private.enforce_write_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  v_actor uuid := auth.uid();
  v_scope text;
  v_limit integer;
  v_window_seconds integer;
  v_window_start timestamptz;
  v_hits integer;
begin
  -- Trusted database/system work has no end-user JWT and is not throttled here.
  if v_actor is null then
    return new;
  end if;

  if tg_nargs <> 3 then
    raise exception 'invalid_rate_limit_trigger_configuration';
  end if;

  v_scope := tg_argv[0];
  v_limit := tg_argv[1]::integer;
  v_window_seconds := tg_argv[2]::integer;

  if v_scope !~ '^[a-z0-9_:-]{1,80}$'
     or v_limit < 1 or v_limit > 10000
     or v_window_seconds < 1 or v_window_seconds > 604800 then
    raise exception 'invalid_rate_limit_trigger_configuration';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from statement_timestamp()) / v_window_seconds) * v_window_seconds
  );

  insert into private.write_rate_limits(actor_id, scope, window_start, hits, updated_at)
  values (v_actor, v_scope, v_window_start, 1, statement_timestamp())
  on conflict (actor_id, scope, window_start)
  do update set
    hits = private.write_rate_limits.hits + 1,
    updated_at = statement_timestamp()
  returning hits into v_hits;

  if v_hits > v_limit then
    raise exception 'rate_limit_exceeded'
      using errcode = 'P0001',
            detail = format('scope=%s limit=%s window_seconds=%s', v_scope, v_limit, v_window_seconds);
  end if;

  -- Small probabilistic cleanup keeps the private quota table bounded without
  -- requiring a cron job. It never exposes request/IP data to application roles.
  if random() < 0.01 then
    delete from private.write_rate_limits
    where window_start < statement_timestamp() - interval '8 days';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_write_rate_limit() from public, anon, authenticated;

-- High-frequency interaction surfaces.
drop trigger if exists abuse_limit_direct_messages on public.direct_messages;
create trigger abuse_limit_direct_messages
before insert on public.direct_messages
for each row execute function private.enforce_write_rate_limit('direct_messages', '30', '60');

drop trigger if exists abuse_limit_direct_conversations on public.direct_conversations;
create trigger abuse_limit_direct_conversations
before insert on public.direct_conversations
for each row execute function private.enforce_write_rate_limit('direct_conversations', '30', '3600');

drop trigger if exists abuse_limit_posts on public.posts;
create trigger abuse_limit_posts
before insert on public.posts
for each row execute function private.enforce_write_rate_limit('posts', '10', '600');

drop trigger if exists abuse_limit_post_comments on public.post_comments;
create trigger abuse_limit_post_comments
before insert on public.post_comments
for each row execute function private.enforce_write_rate_limit('post_comments', '30', '600');

drop trigger if exists abuse_limit_post_likes on public.post_likes;
create trigger abuse_limit_post_likes
before insert on public.post_likes
for each row execute function private.enforce_write_rate_limit('post_likes', '120', '600');

drop trigger if exists abuse_limit_follows on public.follows;
create trigger abuse_limit_follows
before insert on public.follows
for each row execute function private.enforce_write_rate_limit('follows', '60', '600');

-- Resource creation / fan-out surfaces.
drop trigger if exists abuse_limit_teams on public.teams;
create trigger abuse_limit_teams
before insert on public.teams
for each row execute function private.enforce_write_rate_limit('teams', '10', '3600');

drop trigger if exists abuse_limit_projects on public.projects;
create trigger abuse_limit_projects
before insert on public.projects
for each row execute function private.enforce_write_rate_limit('projects', '20', '3600');

drop trigger if exists abuse_limit_team_invitations on public.team_invitations;
create trigger abuse_limit_team_invitations
before insert on public.team_invitations
for each row execute function private.enforce_write_rate_limit('team_invitations', '30', '3600');

drop trigger if exists abuse_limit_project_attachments on public.project_attachments;
create trigger abuse_limit_project_attachments
before insert on public.project_attachments
for each row execute function private.enforce_write_rate_limit('project_attachments', '30', '3600');

-- Moderation/privacy queues: generous enough for legitimate use, bounded against spam.
drop trigger if exists abuse_limit_message_reports on public.message_reports;
create trigger abuse_limit_message_reports
before insert on public.message_reports
for each row execute function private.enforce_write_rate_limit('message_reports', '20', '86400');

drop trigger if exists abuse_limit_privacy_requests on public.privacy_requests;
create trigger abuse_limit_privacy_requests
before insert on public.privacy_requests
for each row execute function private.enforce_write_rate_limit('privacy_requests', '20', '86400');

-- Fix the admin moderation policy: admins may read only a message that actually
-- has a report pointing to that direct_messages.id. The previous predicate
-- compared message_reports.message_id to message_reports.id and was ineffective.
drop policy if exists direct_messages_select_reported_admin on public.direct_messages;
create policy direct_messages_select_reported_admin
on public.direct_messages
for select
to authenticated
using (
  exists (
    select 1 from public.admin_memberships a
    where a.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.message_reports r
    where r.message_id = direct_messages.id
  )
);
