-- New Envista accounts require a locally valid CPF that was checked by the
-- server-side Serpro Consulta CPF v3 flow before Supabase Auth creates the user.
-- The full birth date is intentionally not persisted by this migration.

alter table public.account_private_identifiers
  add column if not exists verification_provider text,
  add column if not exists verified_at timestamptz;

comment on column public.account_private_identifiers.verification_provider is
  'Server-side identity verification provider used before account creation.';
comment on column public.account_private_identifiers.verified_at is
  'Timestamp at which the signup identity was verified. Full birth date is not stored.';

create or replace function private.capture_signup_cpf()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_cpf text;
  normalized_cpf text;
  provider text;
begin
  raw_cpf := new.raw_user_meta_data ->> 'cpf';
  provider := new.raw_user_meta_data ->> 'identity_provider';

  if raw_cpf is null or pg_catalog.btrim(raw_cpf) = '' then
    raise exception using
      errcode = '22023',
      message = 'cpf required for signup';
  end if;

  normalized_cpf := private.normalize_cpf(raw_cpf);
  if not private.is_valid_cpf(normalized_cpf) then
    raise exception using
      errcode = '22023',
      message = 'invalid signup identifier';
  end if;

  if provider is distinct from 'serpro_cpf_v3' then
    raise exception using
      errcode = '22023',
      message = 'identity verification required';
  end if;

  if coalesce(new.raw_user_meta_data ->> 'verified_age_band', '') not in ('child', 'adolescent', 'adult') then
    raise exception using
      errcode = '22023',
      message = 'verified age band required';
  end if;

  insert into public.account_private_identifiers (
    user_id,
    cpf_hash,
    verification_provider,
    verified_at
  )
  values (
    new.id,
    private.cpf_identifier_hash(normalized_cpf),
    provider,
    clock_timestamp()
  );

  -- CPF must never land in user_metadata/JWT/session payloads.
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf';
  return new;
end;
$$;

revoke all on function private.capture_signup_cpf() from public, anon, authenticated;
grant execute on function private.capture_signup_cpf() to supabase_auth_admin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.account_role;
  safe_display_name text;
  verified_age public.age_band;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'investor' then 'investor'::public.account_role
    else 'participant'::public.account_role
  end;

  safe_display_name := left(
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 'Novo usuário'),
    100
  );

  verified_age := case new.raw_user_meta_data ->> 'verified_age_band'
    when 'child' then 'child'::public.age_band
    when 'adolescent' then 'adolescent'::public.age_band
    when 'adult' then 'adult'::public.age_band
    else 'unknown'::public.age_band
  end;

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    'user_' || substring(replace(new.id::text, '-', '') from 1 for 20),
    safe_display_name,
    requested_role
  )
  on conflict (id) do nothing;

  insert into public.account_compliance (user_id, age_band, age_declared_at)
  values (
    new.id,
    verified_age,
    case when verified_age = 'unknown'::public.age_band then null else clock_timestamp() end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Promote the privacy/terms version because required identity verification is a
-- material change to the signup data flow.
update public.legal_documents
set active = false
where document_type in ('terms', 'privacy') and active = true;

insert into public.legal_documents (document_type, document_version, active, audience, published_at)
values
  ('terms', '2026-09-11-v2', true, 'public', now()),
  ('privacy', '2026-09-11-v2', true, 'public', now())
on conflict (document_type, document_version) do update
set active = excluded.active,
    audience = excluded.audience,
    published_at = excluded.published_at;
