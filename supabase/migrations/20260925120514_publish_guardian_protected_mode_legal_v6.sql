
-- Publish legal v6 for the protected minor / guardian confirmation flow.

update public.legal_documents
set active = false
where document_type in ('terms', 'privacy')
  and active = true;

insert into public.legal_documents(document_type, document_version, active, published_at, audience)
values
  ('terms', '2026-09-25-v6', true, now(), 'public'),
  ('privacy', '2026-09-25-v6', true, now(), 'public')
on conflict (document_type, document_version)
do update set
  active = true,
  published_at = excluded.published_at,
  audience = excluded.audience;

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
     or terms_version is distinct from '2026-09-25-v6'
     or not privacy_acknowledged
     or privacy_version is distinct from '2026-09-25-v6' then
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
