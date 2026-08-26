-- Admin só pode ler mensagens que possuem denúncia; não há acesso geral a conversas privadas.
drop policy if exists direct_messages_select_reported_admin on public.direct_messages;
create policy direct_messages_select_reported_admin
on public.direct_messages for select to authenticated
using (
  exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid()))
  and exists (select 1 from public.message_reports r where r.message_id = id)
);
