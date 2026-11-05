-- Atomic onboarding writes: an exception rolls back profile, age and legal rows.
-- Only the currently signed-in user can modify their own data.
create or replace function public.complete_onboarding_atomic(payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_age text := payload ->> 'age_band';
  v_username text := payload ->> 'username';
  v_name text := payload ->> 'display_name';
  v_terms text := payload ->> 'terms_version';
  v_privacy text := payload ->> 'privacy_version';
  v_tags text[];
  v_compliance public.account_compliance%rowtype;
  v_exists boolean;
begin
  if v_user is null then return 'unauthorized'; end if;
  if payload is null or pg_catalog.octet_length(payload::text) > 10000 then return 'invalid'; end if;
  if v_username is null or v_username !~ '^[a-z0-9][a-z0-9._-]{2,31}$'
     or v_username ~ '^user_[0-9a-f]{20}$'
     or v_name is null or pg_catalog.char_length(v_name) not between 1 and 100
     or v_name = 'Novo usuário'
     or v_age is null or v_age not in ('child','adolescent','adult')
     or pg_catalog.jsonb_typeof(payload -> 'interest_tags') is distinct from 'array'
     or pg_catalog.jsonb_array_length(payload -> 'interest_tags') > 12
  then return 'invalid'; end if;

  if not exists (
    select 1 from public.legal_documents
    where document_type='terms' and document_version=v_terms and active=true
  ) or not exists (
    select 1 from public.legal_documents
    where document_type='privacy' and document_version=v_privacy and active=true
  ) then return 'legal'; end if;

  select * into v_compliance from public.account_compliance
  where user_id=v_user for update;
  if not found then return 'profile'; end if;

  if exists(select 1 from public.onboarding_completions where user_id=v_user) then
    return 'completed';
  end if;

  if v_compliance.age_band::text <> 'unknown'
     and v_compliance.age_band::text <> v_age then
    return 'age-locked';
  end if;

  if not exists(select 1 from public.profiles where id=v_user) then
    return 'profile';
  end if;

  select coalesce(pg_catalog.array_agg(distinct pg_catalog.left(pg_catalog.btrim(t.value),48)),
                  array[]::text[]) into v_tags
  from pg_catalog.jsonb_array_elements_text(payload -> 'interest_tags') as t(value)
  where pg_catalog.btrim(t.value) <> '';

  if v_compliance.age_band::text = 'unknown' then
    update public.account_compliance set age_band=v_age::public.age_band
    where user_id=v_user and age_band='unknown';
  end if;

  update public.profiles set
    username=v_username,
    display_name=v_name,
    bio=nullif(payload ->> 'bio',''),
    public_city=nullif(payload ->> 'public_city',''),
    public_state=nullif(payload ->> 'public_state',''),
    public_school=nullif(payload ->> 'public_school',''),
    organization=nullif(payload ->> 'organization',''),
    organization_type=nullif(payload ->> 'organization_type',''),
    interest_tags=v_tags,
    profile_visibility='private',
    allow_messages=false
  where id=v_user;

  insert into public.legal_acceptances(user_id,document_type,document_version,context)
  values (v_user,'terms',v_terms,'public_onboarding'),
         (v_user,'privacy',v_privacy,'public_onboarding')
  on conflict (user_id,document_type,document_version) do nothing;

  if v_age='child' and v_compliance.guardian_required and
     v_compliance.guardian_consent_verified_at is null then
    return 'guardian';
  end if;

  if v_age='adolescent' and v_compliance.guardian_required and
     v_compliance.guardian_consent_verified_at is null and
     v_compliance.protected_mode_started_at is null then
    return 'guardian-choice';
  end if;

  if v_age='child' and v_compliance.guardian_consent_verified_at is null then
    return 'guardian';
  end if;

  insert into public.onboarding_completions(user_id)
  values (v_user) on conflict (user_id) do nothing;
  return 'completed';
exception
  when unique_violation then return 'username';
end;
$$;

revoke all on function public.complete_onboarding_atomic(jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_onboarding_atomic(jsonb)
  to authenticated;
