-- Preflight CPF/CNPJ availability before entering the Supabase Auth transaction.
-- Raw identifiers are never persisted by this function. The HMAC UNIQUE indexes
-- remain the authoritative race-condition protection during user creation.
create or replace function public.signup_identifier_available(
  document_kind text,
  document_value text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_value text := private.normalize_cpf(document_value);
  identifier_hash text;
begin
  if document_kind = 'cpf' then
    if not private.is_valid_cpf(normalized_value) then return false; end if;
  elsif document_kind = 'cnpj' then
    if not private.is_valid_cnpj(normalized_value) then return false; end if;
  else
    return false;
  end if;

  identifier_hash := private.cpf_identifier_hash(normalized_value);

  if document_kind = 'cpf' then
    return not exists (
      select 1 from public.account_private_identifiers where cpf_hash = identifier_hash
    );
  end if;

  return not exists (
    select 1 from public.account_private_identifiers where cnpj_hash = identifier_hash
  );
end;
$$;

revoke all on function public.signup_identifier_available(text,text) from public;
revoke all on function public.signup_identifier_available(text,text) from anon;
revoke all on function public.signup_identifier_available(text,text) from authenticated;
grant execute on function public.signup_identifier_available(text,text) to anon;
