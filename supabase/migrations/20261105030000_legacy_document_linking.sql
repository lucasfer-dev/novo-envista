-- Explicit, private recovery of CPF/CNPJ login for legacy accounts.
-- Never backfill guessed identifiers or disclose the document/hash to clients.

create or replace function public.has_my_login_document()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.account_private_identifiers
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.has_my_login_document() from public, anon, authenticated;
grant execute on function public.has_my_login_document() to authenticated;

-- Only the trusted Next.js server action may invoke this RPC, after it verifies
-- the currently signed-in user, verified email AND current password. No client
-- role can attach a document to an arbitrary account.
create or replace function public.link_legacy_login_document(
  target_user_id uuid,
  document_kind text,
  document_value text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
  identifier_hash text;
  limit_status jsonb;
  inserted_id uuid;
begin
  if target_user_id is null
     or document_value is null
     or coalesce(document_kind, '') not in ('cpf', 'cnpj') then
    return 'unavailable';
  end if;

  if not exists (
    select 1 from auth.users
    where id = target_user_id and email_confirmed_at is not null
  ) then
    return 'unavailable';
  end if;

  if exists (
    select 1 from public.account_private_identifiers
    where user_id = target_user_id
  ) then
    return 'already-linked';
  end if;

  -- Account-scoped durable rate limit; never enumerate other users' documents.
  limit_status := public.consume_private_rate_limit(
    'legacy_doc_link',
    pg_catalog.md5(target_user_id::text),
    5,
    3600
  );
  if coalesce((limit_status ->> 'allowed')::boolean, false) is not true then
    return 'rate';
  end if;

  normalized := private.normalize_cpf(document_value);
  if document_kind = 'cpf' and not private.is_valid_cpf(normalized) then
    return 'unavailable';
  end if;
  if document_kind = 'cnpj' and not private.is_valid_cnpj(normalized) then
    return 'unavailable';
  end if;

  identifier_hash := private.cpf_identifier_hash(normalized);
  if document_kind = 'cpf' then
    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash)
    values (target_user_id, identifier_hash, null)
    on conflict do nothing
    returning user_id into inserted_id;
  else
    insert into public.account_private_identifiers(user_id, cpf_hash, cnpj_hash)
    values (target_user_id, null, identifier_hash)
    on conflict do nothing
    returning user_id into inserted_id;
  end if;

  if inserted_id is null then
    return 'unavailable';
  end if;
  return 'linked';
end;
$$;

revoke all on function public.link_legacy_login_document(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.link_legacy_login_document(uuid, text, text)
  to service_role;
