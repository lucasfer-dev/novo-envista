-- Repair signup after the guardian-protection rollout and tighten minor handling.
--
-- 1. Keep COALESCE/NULLIF as SQL special forms (they cannot be schema-qualified).
-- 2. Use an unambiguous birth-date regex.
-- 3. Require guardian protection for every account under 18.
-- 4. Preserve stable duplicate CPF/CNPJ classification without exposing an
--    unauthenticated availability oracle.

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

-- All adolescents are minors. Exact birth dates are intentionally discarded,
-- so the age band is the privacy-preserving source of truth for existing rows.
update public.account_compliance
set
  guardian_required = true,
  updated_at = pg_catalog.now()
where age_band = 'adolescent'::public.age_band
  and guardian_required = false;

-- This probe disclosed whether an arbitrary CPF/CNPJ already had an account.
-- Registration now relies on the protected Auth transaction + UNIQUE constraints.
revoke all on function public.signup_identifier_available(text,text) from public, anon, authenticated;
