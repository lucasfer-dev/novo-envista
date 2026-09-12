create table if not exists public.course_lesson_assets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600),
  kind text not null default 'file' check (kind in ('video','file')),
  created_at timestamptz not null default now()
);

create index if not exists course_lesson_assets_lesson_id_idx on public.course_lesson_assets(lesson_id);

alter table public.course_lesson_assets enable row level security;

create policy "course lesson assets admins manage"
on public.course_lesson_assets
for all to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_memberships a where a.user_id = auth.uid()));

create policy "course lesson assets enrolled read"
on public.course_lesson_assets
for select to authenticated
using (
  exists (
    select 1
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    join public.course_enrollments e on e.course_id = c.id and e.user_id = auth.uid()
    where l.id = course_lesson_assets.lesson_id and c.status = 'published'
  )
);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'course-assets','course-assets',false,104857600,
  array['video/mp4','video/webm','application/pdf','text/plain','image/jpeg','image/png','image/webp','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-powerpoint']
)
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create policy "course assets admins insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'course-assets'
  and exists (select 1 from public.admin_memberships a where a.user_id = auth.uid())
);

create policy "course assets admins update"
on storage.objects for update to authenticated
using (bucket_id = 'course-assets' and exists (select 1 from public.admin_memberships a where a.user_id = auth.uid()))
with check (bucket_id = 'course-assets' and exists (select 1 from public.admin_memberships a where a.user_id = auth.uid()));

create policy "course assets admins delete"
on storage.objects for delete to authenticated
using (bucket_id = 'course-assets' and exists (select 1 from public.admin_memberships a where a.user_id = auth.uid()));

create policy "course assets authorized read"
on storage.objects for select to authenticated
using (
  bucket_id = 'course-assets'
  and (
    exists (select 1 from public.admin_memberships a where a.user_id = auth.uid())
    or exists (
      select 1
      from public.course_lesson_assets cla
      join public.course_lessons l on l.id = cla.lesson_id
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      join public.course_enrollments e on e.course_id = c.id and e.user_id = auth.uid()
      where cla.path = storage.objects.name and c.status = 'published'
    )
  )
);
