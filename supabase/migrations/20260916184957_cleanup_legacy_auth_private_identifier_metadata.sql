update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'cpf' - 'cnpj'
where (u.raw_user_meta_data ? 'cpf' or u.raw_user_meta_data ? 'cnpj')
  and exists (
    select 1
    from public.account_private_identifiers api
    where api.user_id = u.id
      and (api.cpf_hash is not null or api.cnpj_hash is not null)
  );
