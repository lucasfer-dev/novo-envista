
-- Protected-mode onboarding and guardian confirmation flow.
-- Exact birth dates remain transient. Guardian CPF is never stored raw.

alter table public.account_compliance
  add column if not exists guardian_required boolean,
  add column if not exists protected_mode_started_at timestamptz;

update public.account_compliance
set guardian_required = case
  when age_band in ('child', 'adolescent') then true
  else false
end
where guardian_required is null;

alter table public.account_compliance
  alter column guardian_required set default false,
  alter column guardian_required set not null;

comment on column public.account_compliance.guardian_required is
  'Whether this account requires a guardian link under the product age rules. New signups derive this before the exact birth date is discarded.';
comment on column public.account_compliance.protected_mode_started_at is
  'When an adolescent chose to continue in protected mode before guardian confirmation. Social and direct messaging remain locked until confirmation.';

create table if not exists public.guardian_verification_requests (
  id uuid primary key default gen_random_uuid(),
  minor_user_id uuid not null references auth.users(id) on delete cascade,
  guardian_name text not null,
  guardian_relationship text not null,
  guardian_document_hash text not null,
  token_hash text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  declaration_version text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guardian_verification_name_length check (char_length(guardian_name) between 2 and 120),
  constraint guardian_verification_relationship check (guardian_relationship in ('mother','father','legal_guardian','other')),
  constraint guardian_verification_status check (status in ('pending','verified','expired','revoked'))
);

create index if not exists guardian_verification_minor_status_idx
  on public.guardian_verification_requests(minor_user_id, status, created_at desc);

alter table public.guardian_verification_requests enable row level security;
revoke all on table public.guardian_verification_requests from public, anon, authenticated;

create or replace function private.guardian_token_hash(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $function$
  select pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(value, 'UTF8'), 'sha256'),
    'hex'
  );
$function$;

revoke all on function private.guardian_token_hash(text) from public, anon, authenticated;

create or replace function public.start_protected_minor_mode()
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  affected integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  update public.account_compliance
  set
    protected_mode_started_at = pg_catalog.coalesce(protected_mode_started_at, pg_catalog.now()),
    updated_at = pg_catalog.now()
  where user_id = auth.uid()
    and age_band = 'adolescent'::public.age_band
    and guardian_required = true
    and guardian_consent_verified_at is null;

  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception using errcode = '22023', message = 'protected mode unavailable';
  end if;

  return true;
end;
$function$;

revoke all on function public.start_protected_minor_mode() from public, anon;
grant execute on function public.start_protected_minor_mode() to authenticated;

create or replace function public.create_guardian_verification_request(
  guardian_name_input text,
  relationship_input text,
  guardian_cpf_input text,
  confirmation_token text
)
returns table(request_id uuid, request_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_age_band public.age_band;
  current_guardian_required boolean;
  current_verified_at timestamptz;
  normalized_guardian_name text := pg_catalog.btrim(pg_catalog.coalesce(guardian_name_input, ''));
  normalized_relationship text := pg_catalog.btrim(pg_catalog.coalesce(relationship_input, ''));
  document_hash text;
  new_id uuid;
  new_expiry timestamptz := pg_catalog.now() + interval '48 hours';
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  select c.age_band, c.guardian_required, c.guardian_consent_verified_at
    into current_age_band, current_guardian_required, current_verified_at
  from public.account_compliance c
  where c.user_id = auth.uid();

  if not found
     or current_age_band not in ('child'::public.age_band, 'adolescent'::public.age_band)
     or not current_guardian_required
     or current_verified_at is not null then
    raise exception using errcode = '22023', message = 'guardian confirmation unavailable';
  end if;

  if pg_catalog.char_length(normalized_guardian_name) < 2
     or pg_catalog.char_length(normalized_guardian_name) > 120 then
    raise exception using errcode = '22023', message = 'invalid guardian name';
  end if;

  if normalized_relationship not in ('mother','father','legal_guardian','other') then
    raise exception using errcode = '22023', message = 'invalid guardian relationship';
  end if;

  if not private.is_valid_cpf(guardian_cpf_input) then
    raise exception using errcode = '22023', message = 'invalid guardian identifier';
  end if;

  if pg_catalog.char_length(pg_catalog.coalesce(confirmation_token, '')) < 32
     or pg_catalog.char_length(confirmation_token) > 256 then
    raise exception using errcode = '22023', message = 'invalid guardian token';
  end if;

  document_hash := private.cpf_identifier_hash(guardian_cpf_input);

  update public.guardian_verification_requests
  set status = 'expired', updated_at = pg_catalog.now()
  where minor_user_id = auth.uid()
    and status = 'pending';

  insert into public.guardian_verification_requests (
    minor_user_id,
    guardian_name,
    guardian_relationship,
    guardian_document_hash,
    token_hash,
    status,
    expires_at
  )
  values (
    auth.uid(),
    normalized_guardian_name,
    normalized_relationship,
    document_hash,
    private.guardian_token_hash(confirmation_token),
    'pending',
    new_expiry
  )
  returning id into new_id;

  return query select new_id, new_expiry;
end;
$function$;

revoke all on function public.create_guardian_verification_request(text,text,text,text) from public, anon;
grant execute on function public.create_guardian_verification_request(text,text,text,text) to authenticated;

create or replace function public.get_guardian_verification_request(confirmation_token text)
returns table(
  minor_display_name text,
  guardian_name text,
  guardian_relationship text,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if pg_catalog.char_length(pg_catalog.coalesce(confirmation_token, '')) < 32
     or pg_catalog.char_length(confirmation_token) > 256 then
    return;
  end if;

  return query
  select
    p.display_name,
    r.guardian_name,
    r.guardian_relationship,
    r.expires_at
  from public.guardian_verification_requests r
  join public.profiles p on p.id = r.minor_user_id
  where r.token_hash = private.guardian_token_hash(confirmation_token)
    and r.status = 'pending'
    and r.expires_at > pg_catalog.now()
  limit 1;
end;
$function$;

revoke all on function public.get_guardian_verification_request(text) from public;
grant execute on function public.get_guardian_verification_request(text) to anon, authenticated;

create or replace function public.confirm_guardian_verification(
  confirmation_token text,
  guardian_cpf_input text,
  declaration_version_input text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  request_row public.guardian_verification_requests%rowtype;
  supplied_hash text;
begin
  if declaration_version_input is distinct from '2026-09-25-v1' then
    raise exception using errcode = '22023', message = 'guardian declaration version required';
  end if;

  if pg_catalog.char_length(pg_catalog.coalesce(confirmation_token, '')) < 32
     or pg_catalog.char_length(confirmation_token) > 256
     or not private.is_valid_cpf(guardian_cpf_input) then
    raise exception using errcode = '22023', message = 'invalid guardian confirmation';
  end if;

  select *
    into request_row
  from public.guardian_verification_requests r
  where r.token_hash = private.guardian_token_hash(confirmation_token)
    and r.status = 'pending'
    and r.expires_at > pg_catalog.now()
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'guardian confirmation unavailable';
  end if;

  supplied_hash := private.cpf_identifier_hash(guardian_cpf_input);
  if supplied_hash is distinct from request_row.guardian_document_hash then
    raise exception using errcode = '22023', message = 'invalid guardian confirmation';
  end if;

  update public.guardian_verification_requests
  set
    status = 'verified',
    declaration_version = declaration_version_input,
    verified_at = pg_catalog.now(),
    updated_at = pg_catalog.now()
  where id = request_row.id;

  update public.account_compliance
  set
    guardian_consent_verified_at = pg_catalog.coalesce(guardian_consent_verified_at, pg_catalog.now()),
    guardian_consent_reference = 'guardian-confirmation:' || request_row.id::text,
    updated_at = pg_catalog.now()
  where user_id = request_row.minor_user_id
    and guardian_required = true;

  return true;
end;
$function$;

revoke all on function public.confirm_guardian_verification(text,text,text) from public;
grant execute on function public.confirm_guardian_verification(text,text,text) to anon, authenticated;

create or replace function private.has_product_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.account_compliance c
    where c.user_id = (select auth.uid())
      and (
        c.age_band = 'adult'::public.age_band
        or (
          c.age_band = 'adolescent'::public.age_band
          and (
            c.guardian_required = false
            or c.guardian_consent_verified_at is not null
            or c.protected_mode_started_at is not null
          )
        )
        or (
          c.age_band = 'child'::public.age_band
          and c.guardian_consent_verified_at is not null
        )
      )
  );
$function$;

revoke all on function private.has_product_access() from public, anon, authenticated;

create or replace function private.has_social_access(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.account_compliance c
    where c.user_id = target_user
      and c.age_band in ('child'::public.age_band, 'adolescent'::public.age_band, 'adult'::public.age_band)
      and (
        c.guardian_required = false
        or c.guardian_consent_verified_at is not null
      )
  );
$function$;

revoke all on function private.has_social_access(uuid) from public, anon, authenticated;

create or replace function private.is_participant(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    join public.account_compliance c on c.user_id = p.id
    where p.id = target_user
      and p.role = 'participant'
      and (
        c.age_band = 'adult'
        or (
          c.age_band = 'adolescent'
          and (
            c.guardian_required = false
            or c.guardian_consent_verified_at is not null
            or c.protected_mode_started_at is not null
          )
        )
        or (
          c.age_band = 'child'
          and c.guardian_consent_verified_at is not null
        )
      )
  );
$function$;

revoke all on function private.is_participant(uuid) from public, anon, authenticated;

drop policy if exists onboarding_completions_insert_self_when_ready on public.onboarding_completions;
create policy onboarding_completions_insert_self_when_ready
on public.onboarding_completions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.display_name <> 'Novo usuário'
      and p.username !~ '^user_[0-9a-f]{20}$'
  )
  and exists (
    select 1 from public.account_compliance c
    where c.user_id = (select auth.uid())
      and c.age_band in ('child', 'adolescent', 'adult')
      and c.age_declared_at is not null
      and (
        c.age_band = 'adult'
        or (
          c.age_band = 'adolescent'
          and (
            c.guardian_required = false
            or c.guardian_consent_verified_at is not null
            or c.protected_mode_started_at is not null
          )
        )
        or (
          c.age_band = 'child'
          and c.guardian_consent_verified_at is not null
        )
      )
  )
  and exists (
    select 1
    from public.legal_acceptances a
    join public.legal_documents d
      on d.document_type = a.document_type
     and d.document_version = a.document_version
    where a.user_id = (select auth.uid())
      and a.document_type = 'terms'
      and d.active = true
  )
  and exists (
    select 1
    from public.legal_acceptances a
    join public.legal_documents d
      on d.document_type = a.document_type
     and d.document_version = a.document_version
    where a.user_id = (select auth.uid())
      and a.document_type = 'privacy'
      and d.active = true
  )
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and exists (
    select 1
    from public.account_compliance c
    where c.user_id = (select auth.uid())
      and (
        (
          c.age_band in ('adult', 'adolescent')
          and c.guardian_required = false
        )
        or c.guardian_consent_verified_at is not null
        or (
          c.age_band = 'adolescent'
          and c.guardian_required = true
          and c.protected_mode_started_at is not null
          and profiles.profile_visibility = 'private'
          and profiles.allow_messages = false
        )
      )
  )
);

drop policy if exists direct_conversations_select_participant on public.direct_conversations;
create policy direct_conversations_select_participant
on public.direct_conversations
for select
to authenticated
using (
  private.has_social_access()
  and ((select auth.uid()) = user_a or (select auth.uid()) = user_b)
);

drop policy if exists direct_conversations_insert_allowed on public.direct_conversations;
create policy direct_conversations_insert_allowed
on public.direct_conversations
for insert
to authenticated
with check (
  private.has_social_access()
  and created_by = (select auth.uid())
  and ((select auth.uid()) = user_a or (select auth.uid()) = user_b)
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

drop policy if exists direct_messages_select_participant_or_reported_admin on public.direct_messages;
create policy direct_messages_select_participant_or_reported_admin
on public.direct_messages
for select
to authenticated
using (
  (
    private.has_social_access()
    and exists (
      select 1 from public.direct_conversations c
      where c.id = direct_messages.conversation_id
        and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
    )
  )
  or (
    (select private.is_admin())
    and exists (
      select 1 from public.message_reports r
      where r.message_id = direct_messages.id
    )
  )
);

drop policy if exists direct_messages_insert_participant on public.direct_messages;
create policy direct_messages_insert_participant
on public.direct_messages
for insert
to authenticated
with check (
  private.has_social_access()
  and sender_id = (select auth.uid())
  and exists (
    select 1
    from public.direct_conversations c
    where c.id = direct_messages.conversation_id
      and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
      and not exists (
        select 1 from public.user_blocks b
        where (b.blocker_id = c.user_a and b.blocked_id = c.user_b)
           or (b.blocker_id = c.user_b and b.blocked_id = c.user_a)
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = case when c.user_a = (select auth.uid()) then c.user_b else c.user_a end
          and p.profile_visibility = 'platform'
          and p.allow_messages = true
      )
  )
);

drop policy if exists posts_select_visible_or_admin on public.posts;
create policy posts_select_visible_or_admin
on public.posts
for select
to authenticated
using (
  (private.has_social_access() and private.can_view_post(id))
  or (select private.is_admin())
);

drop policy if exists posts_insert on public.posts;
create policy posts_insert
on public.posts
for insert
to authenticated
with check (
  private.has_social_access()
  and created_by = (select auth.uid())
  and (
    (
      author_user_id = (select auth.uid())
      and (
        visibility = 'private'
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.profile_visibility = 'platform'
        )
      )
    )
    or (
      author_team_id is not null
      and private.is_team_member(author_team_id)
      and (
        visibility = 'private'
        or exists (
          select 1 from public.teams t
          where t.id = posts.author_team_id
            and t.visibility = 'platform'
        )
      )
    )
  )
);

drop policy if exists posts_update on public.posts;
create policy posts_update
on public.posts
for update
to authenticated
using (private.has_social_access() and private.can_edit_post(id))
with check (
  private.has_social_access()
  and private.can_edit_post(id)
  and (
    (
      author_user_id is not null
      and (
        visibility = 'private'
        or exists (
          select 1 from public.profiles p
          where p.id = posts.author_user_id
            and p.profile_visibility = 'platform'
        )
      )
    )
    or (
      author_team_id is not null
      and (
        visibility = 'private'
        or exists (
          select 1 from public.teams t
          where t.id = posts.author_team_id
            and t.visibility = 'platform'
        )
      )
    )
  )
);

drop policy if exists post_comments_select on public.post_comments;
create policy post_comments_select
on public.post_comments
for select
to authenticated
using (private.has_social_access() and private.can_view_post(post_id));

drop policy if exists post_comments_insert on public.post_comments;
create policy post_comments_insert
on public.post_comments
for insert
to authenticated
with check (
  private.has_social_access()
  and user_id = (select auth.uid())
  and private.can_view_post(post_id)
);

drop policy if exists post_comments_update on public.post_comments;
create policy post_comments_update
on public.post_comments
for update
to authenticated
using (private.has_social_access() and user_id = (select auth.uid()))
with check (private.has_social_access() and user_id = (select auth.uid()));

drop policy if exists post_likes_select on public.post_likes;
create policy post_likes_select
on public.post_likes
for select
to authenticated
using (private.has_social_access() and private.can_view_post(post_id));

drop policy if exists post_likes_insert on public.post_likes;
create policy post_likes_insert
on public.post_likes
for insert
to authenticated
with check (
  private.has_social_access()
  and user_id = (select auth.uid())
  and private.can_view_post(post_id)
);

drop policy if exists follows_select_self on public.follows;
create policy follows_select_self
on public.follows
for select
to authenticated
using (private.has_social_access() and follower_id = (select auth.uid()));

drop policy if exists follows_insert_self on public.follows;
create policy follows_insert_self
on public.follows
for insert
to authenticated
with check (
  private.has_social_access()
  and follower_id = (select auth.uid())
  and (
    (
      target_profile_id is not null
      and target_profile_id <> (select auth.uid())
      and exists (
        select 1 from public.profiles p
        where p.id = follows.target_profile_id
          and p.profile_visibility = 'platform'
      )
    )
    or (
      target_team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = follows.target_team_id
          and t.visibility = 'platform'
      )
    )
    or (
      target_project_id is not null
      and exists (
        select 1 from public.projects p
        where p.id = follows.target_project_id
          and p.visibility = 'platform'
      )
    )
  )
);

create or replace function private.capture_signup_cpf()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  raw_cpf text := new.raw_user_meta_data ->> 'cpf';
  raw_cnpj text := new.raw_user_meta_data ->> 'cnpj';
  raw_birth_date text := new.raw_user_meta_data ->> 'birth_date';
  terms_accepted boolean := pg_catalog.coalesce((new.raw_user_meta_data ->> 'signup_terms_accepted')::boolean, false);
  terms_version text := new.raw_user_meta_data ->> 'signup_terms_version';
  privacy_acknowledged boolean := pg_catalog.coalesce((new.raw_user_meta_data ->> 'signup_privacy_acknowledged')::boolean, false);
  privacy_version text := new.raw_user_meta_data ->> 'signup_privacy_version';
  normalized text;
  birth_date date;
  calculated_age integer;
  derived_age_band public.age_band;
  derived_guardian_required boolean;
begin
  if not terms_accepted
     or terms_version is distinct from '2026-09-21-v5'
     or not privacy_acknowledged
     or privacy_version is distinct from '2026-09-21-v5' then
    raise exception using errcode = '22023', message = 'legal acknowledgement required';
  end if;

  if (
    pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cpf, '')), '') is null
    and pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cnpj, '')), '') is null
  ) or (
    pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cpf, '')), '') is not null
    and pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cnpj, '')), '') is not null
  ) then
    raise exception using errcode = '22023', message = 'signup identifier required';
  end if;

  if pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cpf, '')), '') is not null then
    normalized := private.normalize_cpf(raw_cpf);
    if not private.is_valid_cpf(normalized) then
      raise exception using errcode = '22023', message = 'invalid signup identifier';
    end if;

    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash)
    values(new.id, private.cpf_identifier_hash(normalized), null);
  else
    normalized := private.normalize_cpf(raw_cnpj);
    if not private.is_valid_cnpj(normalized) then
      raise exception using errcode = '22023', message = 'invalid signup identifier';
    end if;

    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash)
    values(new.id, null, private.cpf_identifier_hash(normalized));
  end if;

  if raw_birth_date is null or raw_birth_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end if;

  begin
    birth_date := raw_birth_date::date;
  exception when others then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end;

  if birth_date > current_date
     or birth_date < (current_date - interval '120 years')::date then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end if;

  calculated_age := pg_catalog.date_part('year', pg_catalog.age(current_date, birth_date))::integer;
  derived_age_band := case
    when calculated_age < 12 then 'child'::public.age_band
    when calculated_age < 18 then 'adolescent'::public.age_band
    else 'adult'::public.age_band
  end;
  derived_guardian_required := calculated_age <= 16;

  new.raw_user_meta_data := pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(
      pg_catalog.coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf' - 'cnpj' - 'birth_date',
      '{signup_age_band}',
      pg_catalog.to_jsonb(derived_age_band::text),
      true
    ),
    '{signup_guardian_required}',
    pg_catalog.to_jsonb(derived_guardian_required),
    true
  );

  return new;
end;
$function$;

revoke all on function private.capture_signup_cpf() from public, anon, authenticated;
grant execute on function private.capture_signup_cpf() to supabase_auth_admin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested_role public.account_role;
  safe_display_name text;
  derived_age_band public.age_band;
  derived_guardian_required boolean;
  signup_terms_version text;
  signup_privacy_version text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'investor'
      then 'investor'::public.account_role
    else 'participant'::public.account_role
  end;

  safe_display_name := pg_catalog.left(
    pg_catalog.coalesce(
      pg_catalog.nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      'Novo usuário'
    ),
    100
  );

  derived_age_band := case new.raw_user_meta_data ->> 'signup_age_band'
    when 'child' then 'child'::public.age_band
    when 'adolescent' then 'adolescent'::public.age_band
    when 'adult' then 'adult'::public.age_band
    else null
  end;

  derived_guardian_required := case
    when new.raw_user_meta_data ->> 'signup_guardian_required' = 'true' then true
    when new.raw_user_meta_data ->> 'signup_guardian_required' = 'false' then false
    else null
  end;

  signup_terms_version := new.raw_user_meta_data ->> 'signup_terms_version';
  signup_privacy_version := new.raw_user_meta_data ->> 'signup_privacy_version';

  if derived_age_band is null or derived_guardian_required is null then
    raise exception using errcode = '22023', message = 'missing derived signup age protection';
  end if;

  if signup_terms_version is distinct from '2026-09-21-v5'
     or signup_privacy_version is distinct from '2026-09-21-v5' then
    raise exception using errcode = '22023', message = 'missing legal signup versions';
  end if;

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    'user_' || pg_catalog.substr(pg_catalog.replace(new.id::text, '-', ''), 1, 20),
    safe_display_name,
    requested_role
  )
  on conflict (id) do nothing;

  insert into public.account_compliance (user_id, age_band, guardian_required, age_declared_at)
  values (new.id, derived_age_band, derived_guardian_required, pg_catalog.now())
  on conflict (user_id) do update
  set
    age_band = excluded.age_band,
    guardian_required = excluded.guardian_required,
    age_declared_at = pg_catalog.coalesce(public.account_compliance.age_declared_at, excluded.age_declared_at);

  insert into public.legal_acceptances (user_id, document_type, document_version, context)
  values
    (new.id, 'terms', signup_terms_version, 'signup_terms_acceptance'),
    (new.id, 'privacy', signup_privacy_version, 'signup_privacy_acknowledgement')
  on conflict (user_id, document_type, document_version) do nothing;

  update auth.users
  set raw_user_meta_data = pg_catalog.coalesce(raw_user_meta_data, '{}'::jsonb)
    - 'signup_age_band'
    - 'signup_guardian_required'
    - 'signup_terms_accepted'
    - 'signup_terms_version'
    - 'signup_privacy_acknowledged'
    - 'signup_privacy_version'
  where id = new.id;

  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop function if exists public.get_product_user_context();
create function public.get_product_user_context()
returns table(
  id uuid,
  username text,
  display_name text,
  role text,
  avatar_path text,
  bio text,
  public_city text,
  public_state text,
  public_school text,
  organization text,
  organization_type text,
  age_band text,
  guardian_required boolean,
  guardian_consent_verified_at timestamptz,
  protected_mode_started_at timestamptz,
  onboarding_completed boolean
)
language sql
stable
set search_path to 'public'
as $function$
  select
    p.id,
    p.username,
    p.display_name,
    p.role::text,
    p.avatar_path,
    p.bio,
    p.public_city,
    p.public_state,
    p.public_school,
    p.organization,
    p.organization_type,
    c.age_band::text,
    c.guardian_required,
    c.guardian_consent_verified_at,
    c.protected_mode_started_at,
    (o.user_id is not null) as onboarding_completed
  from public.profiles p
  left join public.account_compliance c on c.user_id = p.id
  left join public.onboarding_completions o on o.user_id = p.id
  where p.id = auth.uid()
  limit 1;
$function$;

revoke all on function public.get_product_user_context() from public, anon;
grant execute on function public.get_product_user_context() to authenticated;

comment on table public.guardian_verification_requests is
  'Guardian confirmation requests. Raw guardian CPF and confirmation tokens are never persisted; only protected hashes are stored.';
