alter table public.account_private_identifiers alter column cpf_hash drop not null;
alter table public.account_private_identifiers add column if not exists cnpj_hash text;
create unique index if not exists account_private_identifiers_cnpj_hash_key on public.account_private_identifiers(cnpj_hash) where cnpj_hash is not null;

create or replace function private.is_valid_cnpj(value text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  cnpj text := private.normalize_cpf(value);
  w1 integer[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  w2 integer[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s integer := 0;
  r integer;
  d1 integer;
  d2 integer;
  i integer;
begin
  if pg_catalog.length(cnpj) <> 14 or cnpj = pg_catalog.repeat(pg_catalog.substr(cnpj,1,1),14) then return false; end if;
  for i in 1..12 loop s := s + pg_catalog.substr(cnpj,i,1)::integer * w1[i]; end loop;
  r := s % 11; d1 := case when r < 2 then 0 else 11-r end;
  if d1 <> pg_catalog.substr(cnpj,13,1)::integer then return false; end if;
  s := 0;
  for i in 1..13 loop s := s + pg_catalog.substr(cnpj,i,1)::integer * w2[i]; end loop;
  r := s % 11; d2 := case when r < 2 then 0 else 11-r end;
  return d2 = pg_catalog.substr(cnpj,14,1)::integer;
end;
$$;

revoke all on function private.is_valid_cnpj(text) from public, anon, authenticated;

create or replace function private.capture_signup_cpf()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_cpf text := new.raw_user_meta_data ->> 'cpf';
  raw_cnpj text := new.raw_user_meta_data ->> 'cnpj';
  normalized text;
begin
  if nullif(pg_catalog.btrim(coalesce(raw_cpf,'')),'') is not null and nullif(pg_catalog.btrim(coalesce(raw_cnpj,'')),'') is not null then
    raise exception using errcode='22023', message='multiple signup identifiers';
  end if;
  if nullif(pg_catalog.btrim(coalesce(raw_cpf,'')),'') is not null then
    normalized := private.normalize_cpf(raw_cpf);
    if not private.is_valid_cpf(normalized) then raise exception using errcode='22023', message='invalid signup identifier'; end if;
    insert into public.account_private_identifiers(user_id,cpf_hash,cnpj_hash) values(new.id,private.cpf_identifier_hash(normalized),null);
  elsif nullif(pg_catalog.btrim(coalesce(raw_cnpj,'')),'') is not null then
    normalized := private.normalize_cpf(raw_cnpj);
    if not private.is_valid_cnpj(normalized) then raise exception using errcode='22023', message='invalid signup identifier'; end if;
    insert into public.account_private_identifiers(user_id,cpf_hash,cnpj_hash) values(new.id,null,private.cpf_identifier_hash(normalized));
  end if;
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data,'{}'::jsonb) - 'cpf' - 'cnpj';
  return new;
end;
$$;

create or replace function public.resolve_cpf_login(cpf_value text)
returns uuid
language plpgsql
stable
strict
security definer
set search_path = ''
as $$
declare
  normalized text := private.normalize_cpf(cpf_value);
  result uuid;
begin
  if pg_catalog.length(normalized)=11 and private.is_valid_cpf(normalized) then
    select user_id into result from public.account_private_identifiers where cpf_hash=private.cpf_identifier_hash(normalized) limit 1;
    return result;
  end if;
  if pg_catalog.length(normalized)=14 and private.is_valid_cnpj(normalized) then
    select user_id into result from public.account_private_identifiers where cnpj_hash=private.cpf_identifier_hash(normalized) limit 1;
    return result;
  end if;
  return null;
end;
$$;

comment on column public.account_private_identifiers.cnpj_hash is 'HMAC-SHA-256 of normalized CNPJ. Raw CNPJ is never persisted.';
comment on function public.resolve_cpf_login(text) is 'Service-role-only private CPF/CNPJ resolver for the login bridge.';
