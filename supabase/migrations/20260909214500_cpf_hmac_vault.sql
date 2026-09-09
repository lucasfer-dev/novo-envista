-- Hardens CPF identifiers by replacing plain SHA-256 with HMAC-SHA-256.
-- The HMAC key is encrypted at rest by Supabase Vault and is not exposed to
-- browser roles or to the Edge Function.

do $$
begin
  if not exists (
    select 1 from vault.secrets where name = 'envista_cpf_hmac_key'
  ) then
    perform vault.create_secret(
      pg_catalog.encode(extensions.gen_random_bytes(32), 'hex'),
      'envista_cpf_hmac_key',
      'HMAC key for private Envista CPF account identifiers'
    );
  end if;
end
$$;

create or replace function private.cpf_identifier_hash(value text)
returns text
language plpgsql
stable
strict
security definer
set search_path = ''
as $$
declare
  normalized_cpf text := private.normalize_cpf(value);
  hmac_key text;
begin
  select decrypted_secret
    into hmac_key
  from vault.decrypted_secrets
  where name = 'envista_cpf_hmac_key'
  limit 1;

  if hmac_key is null then
    raise exception using
      errcode = '55000',
      message = 'cpf identifier key unavailable';
  end if;

  return pg_catalog.encode(
    extensions.hmac(normalized_cpf, hmac_key, 'sha256'),
    'hex'
  );
end;
$$;

revoke all on function private.cpf_identifier_hash(text) from public, anon, authenticated;

grant execute on function private.cpf_identifier_hash(text) to supabase_auth_admin;

create or replace function private.capture_signup_cpf()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_cpf text;
  normalized_cpf text;
begin
  raw_cpf := new.raw_user_meta_data ->> 'cpf';

  if raw_cpf is null or pg_catalog.btrim(raw_cpf) = '' then
    return new;
  end if;

  normalized_cpf := private.normalize_cpf(raw_cpf);
  if not private.is_valid_cpf(normalized_cpf) then
    raise exception using
      errcode = '22023',
      message = 'invalid signup identifier';
  end if;

  insert into public.account_private_identifiers (user_id, cpf_hash)
  values (new.id, private.cpf_identifier_hash(normalized_cpf));

  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf';
  return new;
end;
$$;

create or replace function public.resolve_cpf_login(cpf_value text)
returns uuid
language sql
stable
strict
security definer
set search_path = ''
as $$
  select identifier.user_id
  from public.account_private_identifiers as identifier
  where identifier.cpf_hash = private.cpf_identifier_hash(cpf_value)
  limit 1;
$$;

revoke all on function public.resolve_cpf_login(text) from public, anon, authenticated;
grant execute on function public.resolve_cpf_login(text) to service_role;

comment on function public.resolve_cpf_login(text) is
  'Service-role-only CPF resolver for the private login bridge. Never grant to browser roles.';

comment on column public.account_private_identifiers.cpf_hash is
  'HMAC-SHA-256 of normalized CPF using a Vault-managed key. Raw CPF is never persisted.';
