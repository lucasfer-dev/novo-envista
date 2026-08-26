begin;

-- A função SECURITY DEFINER não precisa ficar exposta enquanto o fluxo admin
-- ainda não existe. Removemos em vez de aceitar um warning evitável.
drop function if exists public.is_admin();

-- Mesmo sem grants para cliente, deixamos a negação explícita para que a intenção
-- de segurança fique documentada e o advisor não dependa de comportamento implícito.
create policy admin_memberships_explicit_deny
on public.admin_memberships
for all
to anon, authenticated
using (false)
with check (false);

commit;
