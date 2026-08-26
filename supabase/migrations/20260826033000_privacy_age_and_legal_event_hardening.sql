begin;

-- Enquanto a faixa etária não foi aferida por fluxo confiável, o perfil continua
-- privado e mensagens ficam desabilitadas. Crianças só podem optar por perfil de
-- plataforma após verificação de responsável; mensagens continuam bloqueadas.
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and (
    (profile_visibility = 'private' and allow_messages = false)
    or exists (
      select 1
      from public.account_compliance c
      where c.user_id = (select auth.uid())
        and (
          c.age_band in ('adolescent', 'adult')
          or (
            c.age_band = 'child'
            and c.guardian_consent_verified_at is not null
            and allow_messages = false
          )
        )
    )
  )
);

-- Registros jurídicos precisam ser produzidos por um fluxo confiável e uma versão
-- conhecida do documento. O browser não recebe INSERT direto nesta fundação.
drop policy if exists legal_acceptances_insert_self on public.legal_acceptances;
revoke insert on public.legal_acceptances from authenticated;
revoke insert (user_id, document_type, document_version, context)
on public.legal_acceptances from authenticated;

comment on table public.legal_acceptances is
  'Registro imutável de evento jurídico. Para Termos, registra aceite; para Aviso de Privacidade, o evento representa ciência/apresentação e não cria por si só uma base legal de consentimento. Inserções ficam reservadas a fluxo confiável e versionado.';

commit;
