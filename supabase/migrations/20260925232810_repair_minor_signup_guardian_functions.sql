-- Repair signup and guardian verification after the protected-minor rollout.
--
-- The 2026-09-25 rollout accidentally reintroduced schema-qualified COALESCE
-- and NULLIF expressions, which fail at runtime in PL/pgSQL. This migration
-- repairs every affected guardian/signup function and protects all users under 18.

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
    protected_mode_started_at = coalesce(protected_mode_started_at, pg_catalog.now()),
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
  normalized_guardian_name text := pg_catalog.btrim(coalesce(guardian_name_input, ''));
  normalized_relationship text := pg_catalog.btrim(coalesce(relationship_input, ''));
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

  if pg_catalog.char_length(coalesce(confirmation_token, '')) < 32
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
  if pg_catalog.char_length(coalesce(confirmation_token, '')) < 32
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

  if pg_catalog.char_length(coalesce(confirmation_token, '')) < 32
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
    guardian_consent_verified_at = coalesce(guardian_consent_verified_at, pg_catalog.now()),
    guardian_consent_reference = 'guardian-confirmation:' || request_row.id::text,
    updated_at = pg_catalog.now()
  where user_id = request_row.minor_user_id
    and guardian_required = true;

  return true;
end;
$function$;

revoke all on function public.confirm_guardian_verification(text,text,text) from public;
grant execute on function public.confirm_guardian_verification(text,text,text) to anon, authenticated;

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
  terms_accepted boolean := coalesce((new.raw_user_meta_data ->> 'signup_terms_accepted')::boolean, false);
  terms_version text := new.raw_user_meta_data ->> 'signup_terms_version';
  privacy_acknowledged boolean := coalesce((new.raw_user_meta_data ->> 'signup_privacy_acknowledged')::boolean, false);
  privacy_version text := new.raw_user_meta_data ->> 'signup_privacy_version';
  normalized text;
  identifier_hash text;
  birth_date date;
  calculated_age integer;
  derived_age_band public.age_band;
  derived_guardian_required boolean;
begin
  if not terms_accepted
     or terms_version is distinct from '2026-09-25-v6'
     or not privacy_acknowledged
     or privacy_version is distinct from '2026-09-25-v6' then
    raise exception using errcode = '22023', message = 'legal acknowledgement required';
  end if;

  if (
    nullif(pg_catalog.btrim(coalesce(raw_cpf, '')), '') is null
    and nullif(pg_catalog.btrim(coalesce(raw_cnpj, '')), '') is null
  ) or (
    nullif(pg_catalog.btrim(coalesce(raw_cpf, '')), '') is not null
    and nullif(pg_catalog.btrim(coalesce(raw_cnpj, '')), '') is not null
  ) then
    raise exception using errcode = '22023', message = 'signup identifier required';
  end if;

  if nullif(pg_catalog.btrim(coalesce(raw_cpf, '')), '') is not null then
    normalized := private.normalize_cpf(raw_cpf);
    if not private.is_valid_cpf(normalized) then
      raise exception using errcode = '22023', message = 'invalid signup identifier';
    end if;

    identifier_hash := private.cpf_identifier_hash(normalized);
    if exists (
      select 1
      from public.account_private_identifiers
      where cpf_hash = identifier_hash
    ) then
      raise exception using errcode = '23505', message = 'signup identifier already exists';
    end if;

    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash)
    values(new.id, identifier_hash, null);
  else
    normalized := private.normalize_cpf(raw_cnpj);
    if not private.is_valid_cnpj(normalized) then
      raise exception using errcode = '22023', message = 'invalid signup identifier';
    end if;

    identifier_hash := private.cpf_identifier_hash(normalized);
    if exists (
      select 1
      from public.account_private_identifiers
      where cnpj_hash = identifier_hash
    ) then
      raise exception using errcode = '23505', message = 'signup identifier already exists';
    end if;

    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash)
    values(new.id, null, identifier_hash);
  end if;

  if raw_birth_date is null
     or raw_birth_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
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
  derived_guardian_required := calculated_age < 18;

  new.raw_user_meta_data := pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(
      coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf' - 'cnpj' - 'birth_date',
      '{signup_age_band}',
      pg_catalog.to_jsonb(derived_age_band::text),
      true
    ),
    '{signup_guardian_required}',
    pg_catalog.to_jsonb(derived_guardian_required),
    true
  );

  return new;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'signup identifier already exists';
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
    coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
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

  if signup_terms_version is distinct from '2026-09-25-v6'
     or signup_privacy_version is distinct from '2026-09-25-v6' then
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
    age_declared_at = coalesce(public.account_compliance.age_declared_at, excluded.age_declared_at);

  insert into public.legal_acceptances (user_id, document_type, document_version, context)
  values
    (new.id, 'terms', signup_terms_version, 'signup_terms_acceptance'),
    (new.id, 'privacy', signup_privacy_version, 'signup_privacy_acknowledgement')
  on conflict (user_id, document_type, document_version) do nothing;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
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

-- All adolescents are minors. Exact birth dates are intentionally discarded,
-- so the age band is the privacy-preserving source of truth for existing rows.
update public.account_compliance
set
  guardian_required = true,
  updated_at = pg_catalog.now()
where age_band = 'adolescent'::public.age_band
  and guardian_required = false;
