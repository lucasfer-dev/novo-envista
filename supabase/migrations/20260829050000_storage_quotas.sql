-- Storage quotas and safer download metadata for public launch.
-- Bucket MIME/size limits remain the first line of defense; this adds aggregate
-- quotas that cannot be bypassed by calling the Data API directly.

create or replace function private.enforce_project_attachment_quota()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  existing_count integer;
  existing_bytes bigint;
begin
  select count(*), coalesce(sum(size_bytes), 0)
    into existing_count, existing_bytes
  from public.project_attachments
  where project_id = new.project_id;

  if existing_count >= 50 then
    raise exception 'project_attachment_quota_exceeded'
      using errcode = 'P0001', detail = 'max_files=50';
  end if;

  if existing_bytes + new.size_bytes > 104857600 then
    raise exception 'project_attachment_quota_exceeded'
      using errcode = 'P0001', detail = 'max_total_bytes=104857600';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_project_attachment_quota() from public, anon, authenticated;

drop trigger if exists project_attachments_quota_guard on public.project_attachments;
create trigger project_attachments_quota_guard
before insert on public.project_attachments
for each row execute function private.enforce_project_attachment_quota();

-- Reject control characters in user-facing filenames. Existing filenames are
-- retained only when they already satisfy this rule.
alter table public.project_attachments
  drop constraint if exists project_attachments_safe_filename;
alter table public.project_attachments
  add constraint project_attachments_safe_filename
  check (file_name !~ '[[:cntrl:]]');

-- Keep bucket configuration authoritative even if it was changed manually.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']),
  ('team-assets','team-assets',false,4194304,array['image/jpeg','image/png','image/webp']),
  ('project-assets','project-assets',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/plain'])
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;
