create table if not exists private.auth_rate_limits (
  scope text not null,
  subject_hash text not null,
  window_started_at timestamptz not null default clock_timestamp(),
  attempts integer not null default 0 check (attempts >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (scope, subject_hash)
);

revoke all on table private.auth_rate_limits from public, anon, authenticated;

create or replace function public.consume_private_rate_limit(
  rate_scope text,
  subject_hash text,
  max_attempts integer,
  window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  now_at timestamptz := clock_timestamp();
  current_row private.auth_rate_limits%rowtype;
  allowed boolean;
  retry_after integer := 0;
begin
  if rate_scope is null or rate_scope !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid_rate_scope' using errcode = '22023';
  end if;
  if subject_hash is null or char_length(subject_hash) < 32 or char_length(subject_hash) > 128 then
    raise exception 'invalid_subject_hash' using errcode = '22023';
  end if;
  if max_attempts < 1 or max_attempts > 1000 or window_seconds < 10 or window_seconds > 86400 then
    raise exception 'invalid_rate_policy' using errcode = '22023';
  end if;

  insert into private.auth_rate_limits(scope, subject_hash, window_started_at, attempts, blocked_until, updated_at)
  values (rate_scope, subject_hash, now_at, 0, null, now_at)
  on conflict (scope, subject_hash) do nothing;

  select * into current_row
  from private.auth_rate_limits
  where scope = rate_scope and auth_rate_limits.subject_hash = consume_private_rate_limit.subject_hash
  for update;

  if current_row.blocked_until is not null and current_row.blocked_until > now_at then
    retry_after := greatest(1, ceil(extract(epoch from (current_row.blocked_until - now_at)))::integer);
    return jsonb_build_object('allowed', false, 'retry_after', retry_after);
  end if;

  if current_row.window_started_at <= now_at - make_interval(secs => window_seconds) then
    current_row.window_started_at := now_at;
    current_row.attempts := 0;
    current_row.blocked_until := null;
  end if;

  current_row.attempts := current_row.attempts + 1;
  allowed := current_row.attempts <= max_attempts;
  if not allowed then
    current_row.blocked_until := current_row.window_started_at + make_interval(secs => window_seconds);
    if current_row.blocked_until <= now_at then
      current_row.blocked_until := now_at + make_interval(secs => window_seconds);
    end if;
    retry_after := greatest(1, ceil(extract(epoch from (current_row.blocked_until - now_at)))::integer);
  end if;

  update private.auth_rate_limits
  set window_started_at = current_row.window_started_at,
      attempts = current_row.attempts,
      blocked_until = current_row.blocked_until,
      updated_at = now_at
  where scope = rate_scope and auth_rate_limits.subject_hash = consume_private_rate_limit.subject_hash;

  return jsonb_build_object('allowed', allowed, 'retry_after', retry_after);
end;
$$;

revoke all on function public.consume_private_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_private_rate_limit(text,text,integer,integer) to service_role;

create or replace function public.clear_private_rate_limit(rate_scope text, subject_hash text)
returns void
language sql
security definer
set search_path = pg_catalog, private
as $$
  delete from private.auth_rate_limits
  where scope = rate_scope and auth_rate_limits.subject_hash = clear_private_rate_limit.subject_hash;
$$;

revoke all on function public.clear_private_rate_limit(text,text) from public, anon, authenticated;
grant execute on function public.clear_private_rate_limit(text,text) to service_role;

create table if not exists private.external_refresh_locks (
  scope text primary key,
  next_allowed_at timestamptz not null default '-infinity'::timestamptz,
  updated_at timestamptz not null default clock_timestamp()
);

revoke all on table private.external_refresh_locks from public, anon, authenticated;

create or replace function public.claim_competition_refresh()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  now_at timestamptz := clock_timestamp();
  available_at timestamptz;
begin
  if auth.uid() is null then return false; end if;

  insert into private.external_refresh_locks(scope, next_allowed_at, updated_at)
  values ('competitions', '-infinity'::timestamptz, now_at)
  on conflict (scope) do nothing;

  select next_allowed_at into available_at
  from private.external_refresh_locks
  where scope = 'competitions'
  for update;

  if available_at > now_at then return false; end if;

  update private.external_refresh_locks
  set next_allowed_at = now_at + interval '2 minutes', updated_at = now_at
  where scope = 'competitions';

  return true;
end;
$$;

revoke all on function public.claim_competition_refresh() from public, anon;
grant execute on function public.claim_competition_refresh() to authenticated;

create or replace function private.enforce_project_attachment_quota()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  existing_count integer;
  existing_bytes bigint;
begin
  perform 1 from public.projects where id = new.project_id for update;

  select count(*), coalesce(sum(size_bytes), 0)
    into existing_count, existing_bytes
  from public.project_attachments
  where project_id = new.project_id;

  if existing_count >= 50 then
    raise exception 'project_attachment_quota_exceeded'
      using errcode = 'P0001', detail = 'max_files=50';
  end if;

  if existing_bytes + new.size_bytes > 104857600 then
    raise exception 'project_attachment_quota_exceeded'
      using errcode = 'P0001', detail = 'max_total_bytes=104857600';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_project_attachment_quota() from public, anon, authenticated;
