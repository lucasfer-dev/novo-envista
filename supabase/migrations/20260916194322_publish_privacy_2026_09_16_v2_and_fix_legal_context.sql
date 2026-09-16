update public.legal_acceptances
set context = 'public_onboarding'
where context = 'internal_test'
  and document_version not like 'internal-%';

update public.legal_documents
set active = false
where document_type = 'privacy'
  and active = true;

insert into public.legal_documents(document_type, document_version, active, published_at, audience)
values ('privacy', '2026-09-16-v2', true, now(), 'public')
on conflict (document_type, document_version)
do update set active = true, published_at = excluded.published_at, audience = excluded.audience;
