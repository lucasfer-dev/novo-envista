update public.legal_documents
set active=false
where document_type='terms' and active=true;

insert into public.legal_documents(document_type,document_version,active,published_at,audience)
values('terms','2026-09-15-v2',true,now(),'public')
on conflict (document_type,document_version)
do update set active=true,published_at=excluded.published_at,audience=excluded.audience;
