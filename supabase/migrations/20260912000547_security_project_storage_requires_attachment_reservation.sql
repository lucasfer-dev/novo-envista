drop policy if exists project_assets_insert on storage.objects;

create policy project_assets_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-assets'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and private.can_edit_project(private.safe_uuid((storage.foldername(name))[1]))
  and exists (
    select 1
    from public.project_attachments pa
    where pa.path = name
      and pa.project_id = private.safe_uuid((storage.foldername(name))[1])
      and pa.uploaded_by = (select auth.uid())
  )
);
