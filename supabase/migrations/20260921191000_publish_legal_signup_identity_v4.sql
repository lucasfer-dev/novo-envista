-- Publish the legal text that reflects mandatory CPF/CNPJ and the
-- privacy-minimizing birth-date flow used during signup.

update public.legal_documents
set active = false
where document_type in ('terms', 'privacy')
  and active = true;

insert into public.legal_documents(document_type, document_version, active, published_at, audience)
values
  ('terms', '2026-09-21-v4', true, now(), 'public'),
  ('privacy', '2026-09-21-v4', true, now(), 'public')
on conflict (document_type, document_version)
do update set
  active = true,
  published_at = excluded.published_at,
  audience = excluded.audience;
