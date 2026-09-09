-- CPF is used only as a private login identifier.
-- The raw CPF exists only during the signup transaction and is removed from
-- auth.users.raw_user_meta_data before the user row is persisted.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.account_private_identifiers (
  user_id uuid primary key
    references auth.users(id) on delete cascade
    deferrable initially deferred,
  cpf_hash text not null unique,
  created_at timestamptz not null default now(),
  constraint account_private_identifiers_cpf_hash_format
    check (cpf_hash ~ '^[0-9a-f]{64}$')
);

comment on table public.account_private_identifiers is
  'Private authentication identifiers. Stores only a one-way SHA-256 CPF hash; never expose through profile APIs.';
comment on column public.account_private_identifiers.cpf_hash is
  'SHA-256 of the normalized 11-digit CPF. Raw CPF is intentionally not persisted.';

alter table public.account_private_identifiers enable row level security;

-- New public-schema objects can inherit broad default grants on older projects.
-- Explicitly close the table to browser roles; the Edge login bridge reads it
-- only through the Supabase secret/service role.
revoke all on table public.account_private_identifiers from public, anon, authenticated;
grant select on table public.account_private_identifiers to service_role;

create or replace function private.normalize_cpf(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select pg_catalog.regexp_replace(value, '[^0-9]', '', 'g');
$$;

create or replace function private.is_valid_cpf(value text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  cpf text := private.normalize_cpf(value);
  sum_value integer := 0;
  digit integer;
  i integer;
begin
  if pg_catalog.length(cpf) <> 11 then
    return false;
  end if;

  if cpf = pg_catalog.repeat(pg_catalog.substr(cpf, 1, 1), 11) then
    return false;
  end if;

  for i in 1..9 loop
    sum_value := sum_value + pg_catalog.substr(cpf, i, 1)::integer * (11 - i);
  end loop;

  digit := 11 - (sum_value % 11);
  if digit >= 10 then
    digit := 0;
  end if;

  if digit <> pg_catalog.substr(cpf, 10, 1)::integer then
    return false;
  end if;

  sum_value := 0;
  for i in 1..10 loop
    sum_value := sum_value + pg_catalog.substr(cpf, i, 1)::integer * (12 - i);
  end loop;

  digit := 11 - (sum_value % 11);
  if digit >= 10 then
    digit := 0;
  end if;

  return digit = pg_catalog.substr(cpf, 11, 1)::integer;
end;
$$;

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
  values (
    new.id,
    pg_catalog.encode(extensions.digest(normalized_cpf, 'sha256'), 'hex')
  );

  -- Do not allow CPF to land in user_metadata/JWT/session payloads.
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf';
  return new;
end;
$$;

revoke all on function private.normalize_cpf(text) from public, anon, authenticated;
revoke all on function private.is_valid_cpf(text) from public, anon, authenticated;
revoke all on function private.capture_signup_cpf() from public, anon, authenticated;

grant usage on schema private to supabase_auth_admin;
grant execute on function private.capture_signup_cpf() to supabase_auth_admin;

drop trigger if exists before_auth_user_capture_cpf on auth.users;
create trigger before_auth_user_capture_cpf
before insert on auth.users
for each row
execute function private.capture_signup_cpf();
