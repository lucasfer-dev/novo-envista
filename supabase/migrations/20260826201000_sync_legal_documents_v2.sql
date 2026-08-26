-- Alinha as versões jurídicas exibidas/registradas pelo app com as versões aceitas pela RLS.
-- O app usa internal-2026-08-26-v2 para Termos e Privacidade.

update public.legal_documents
set active = false
where document_type in ('terms', 'privacy')
  and active = true
  and document_version <> 'internal-2026-08-26-v2';

insert into public.legal_documents (document_type, document_version, active, audience)
values
  ('terms', 'internal-2026-08-26-v2', true, 'internal_test'),
  ('privacy', 'internal-2026-08-26-v2', true, 'internal_test')
on conflict (document_type, document_version)
do update set
  active = excluded.active,
  audience = excluded.audience;
