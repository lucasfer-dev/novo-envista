-- Storage privado para assets de equipe e arquivos de projeto.
-- SVG não é aceito nos buckets de imagem para reduzir superfície de XSS.

alter table public.teams add column if not exists logo_path text;

create table if not exists public.project_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  path text not null unique check (char_length(path) between 10 and 500),
  file_name text not null check (char_length(file_name) between 1 and 180),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf','text/plain')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index if not exists project_attachments_project_idx on public.project_attachments(project_id, created_at desc);
create index if not exists project_attachments_uploader_idx on public.project_attachments(uploaded_by);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('team-assets','team-assets',false,4194304,array['image/jpeg','image/png','image/webp']),
  ('project-assets','project-assets',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/plain'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function private.safe_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function private.can_manage_project_files(target_project uuid, viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project
      and (
        p.owner_user_id = viewer
        or (p.owner_team_id is not null and private.can_manage_team(p.owner_team_id, viewer))
      )
  );
$$;

revoke all on function private.can_manage_project_files(uuid,uuid) from public;
grant execute on function private.can_manage_project_files(uuid,uuid) to authenticated;

alter table public.project_attachments enable row level security;
revoke all on public.project_attachments from anon;
revoke all on public.project_attachments from authenticated;
grant select,insert,delete on public.project_attachments to authenticated;

drop policy if exists project_attachments_select on public.project_attachments;
create policy project_attachments_select on public.project_attachments for select to authenticated
using (private.can_view_project(project_id));

drop policy if exists project_attachments_insert on public.project_attachments;
create policy project_attachments_insert on public.project_attachments for insert to authenticated
with check (uploaded_by=(select auth.uid()) and private.can_edit_project(project_id));

drop policy if exists project_attachments_delete on public.project_attachments;
create policy project_attachments_delete on public.project_attachments for delete to authenticated
using (uploaded_by=(select auth.uid()) or private.can_manage_project_files(project_id));

-- Logo/asset de equipe: caminho team_uuid/user_uuid/arquivo.ext.
drop policy if exists team_assets_select on storage.objects;
create policy team_assets_select on storage.objects for select to authenticated
using (
  bucket_id='team-assets'
  and exists (
    select 1 from public.teams t
    where t.id=private.safe_uuid((storage.foldername(name))[1])
      and (t.visibility='platform' or private.is_team_member(t.id))
  )
);

drop policy if exists team_assets_insert on storage.objects;
create policy team_assets_insert on storage.objects for insert to authenticated
with check (
  bucket_id='team-assets'
  and (storage.foldername(name))[2]=(select auth.uid())::text
  and private.can_manage_team(private.safe_uuid((storage.foldername(name))[1]))
);

drop policy if exists team_assets_update on storage.objects;
create policy team_assets_update on storage.objects for update to authenticated
using (bucket_id='team-assets' and private.can_manage_team(private.safe_uuid((storage.foldername(name))[1])))
with check (bucket_id='team-assets' and private.can_manage_team(private.safe_uuid((storage.foldername(name))[1])));

drop policy if exists team_assets_delete on storage.objects;
create policy team_assets_delete on storage.objects for delete to authenticated
using (bucket_id='team-assets' and private.can_manage_team(private.safe_uuid((storage.foldername(name))[1])));

-- Arquivos de projeto: caminho project_uuid/user_uuid/arquivo.ext.
drop policy if exists project_assets_select on storage.objects;
create policy project_assets_select on storage.objects for select to authenticated
using (bucket_id='project-assets' and private.can_view_project(private.safe_uuid((storage.foldername(name))[1])));

drop policy if exists project_assets_insert on storage.objects;
create policy project_assets_insert on storage.objects for insert to authenticated
with check (
  bucket_id='project-assets'
  and (storage.foldername(name))[2]=(select auth.uid())::text
  and private.can_edit_project(private.safe_uuid((storage.foldername(name))[1]))
);

drop policy if exists project_assets_update on storage.objects;
create policy project_assets_update on storage.objects for update to authenticated
using (
  bucket_id='project-assets'
  and private.can_edit_project(private.safe_uuid((storage.foldername(name))[1]))
  and (owner_id=(select auth.uid())::text or private.can_manage_project_files(private.safe_uuid((storage.foldername(name))[1])))
)
with check (bucket_id='project-assets' and private.can_edit_project(private.safe_uuid((storage.foldername(name))[1])));

drop policy if exists project_assets_delete on storage.objects;
create policy project_assets_delete on storage.objects for delete to authenticated
using (
  bucket_id='project-assets'
  and (owner_id=(select auth.uid())::text or private.can_manage_project_files(private.safe_uuid((storage.foldername(name))[1])))
);
