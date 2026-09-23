-- Keep signup identifier uniqueness while surfacing a stable database error
-- that the application can classify without exposing CPF/CNPJ values.
create or replace function private.capture_signup_cpf()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_cpf text := new.raw_user_meta_data ->> 'cpf';
  raw_cnpj text := new.raw_user_meta_data ->> 'cnpj';
  raw_birth_date text := new.raw_user_meta_data ->> 'birth_date';
  terms_accepted boolean := pg_catalog.coalesce((new.raw_user_meta_data ->> 'signup_terms_accepted')::boolean, false);
  terms_version text := new.raw_user_meta_data ->> 'signup_terms_version';
  privacy_acknowledged boolean := pg_catalog.coalesce((new.raw_user_meta_data ->> 'signup_privacy_acknowledged')::boolean, false);
  privacy_version text := new.raw_user_meta_data ->> 'signup_privacy_version';
  normalized text;
  identifier_hash text;
  birth_date date;
  calculated_age integer;
  derived_age_band public.age_band;
begin
  if not terms_accepted or terms_version is distinct from '2026-09-21-v5'
     or not privacy_acknowledged or privacy_version is distinct from '2026-09-21-v5' then
    raise exception using errcode = '22023', message = 'legal acknowledgement required';
  end if;

  if (pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cpf, '')), '') is null
      and pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cnpj, '')), '') is null)
     or (pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cpf, '')), '') is not null
      and pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cnpj, '')), '') is not null) then
    raise exception using errcode = '22023', message = 'signup identifier required';
  end if;

  if pg_catalog.nullif(pg_catalog.btrim(pg_catalog.coalesce(raw_cpf, '')), '') is not null then
    normalized := private.normalize_cpf(raw_cpf);
    if not private.is_valid_cpf(normalized) then
      raise exception using errcode = '22023', message = 'invalid signup identifier';
    end if;
    identifier_hash := private.cpf_identifier_hash(normalized);
    if exists (select 1 from public.account_private_identifiers where cpf_hash = identifier_hash) then
      raise exception using errcode = '23505', message = 'signup identifier already exists';
    end if;
    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash) values(new.id, identifier_hash, null);
  else
    normalized := private.normalize_cpf(raw_cnpj);
    if not private.is_valid_cnpj(normalized) then
      raise exception using errcode = '22023', message = 'invalid signup identifier';
    end if;
    identifier_hash := private.cpf_identifier_hash(normalized);
    if exists (select 1 from public.account_private_identifiers where cnpj_hash = identifier_hash) then
      raise exception using errcode = '23505', message = 'signup identifier already exists';
    end if;
    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash) values(new.id, null, identifier_hash);
  end if;

  if raw_birth_date is null or raw_birth_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end if;
  begin birth_date := raw_birth_date::date;
  exception when others then raise exception using errcode = '22023', message = 'invalid signup birth date';
  end;
  if birth_date > current_date or birth_date < (current_date - interval '120 years')::date then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end if;

  calculated_age := pg_catalog.date_part('year', pg_catalog.age(current_date, birth_date))::integer;
  derived_age_band := case when calculated_age < 12 then 'child'::public.age_band when calculated_age < 18 then 'adolescent'::public.age_band else 'adult'::public.age_band end;
  new.raw_user_meta_data := pg_catalog.jsonb_set(
    pg_catalog.coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf' - 'cnpj' - 'birth_date',
    '{signup_age_band}', pg_catalog.to_jsonb(derived_age_band::text), true
  );
  return new;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'signup identifier already exists';
end;
$$;

revoke all on function private.capture_signup_cpf() from public, anon, authenticated;
grant execute on function private.capture_signup_cpf() to supabase_auth_admin;
