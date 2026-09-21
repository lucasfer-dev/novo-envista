drop policy if exists "course lesson assets admins manage" on public.course_lesson_assets;

alter policy "course lesson assets enrolled read" on public.course_lesson_assets
using (
  exists (
    select 1
    from public.admin_memberships a
    where a.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    join public.course_enrollments e
      on e.course_id = c.id
     and e.user_id = (select auth.uid())
    where l.id = course_lesson_assets.lesson_id
      and c.status = 'published'
  )
);

create policy "course lesson assets admins insert"
on public.course_lesson_assets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_memberships a
    where a.user_id = (select auth.uid())
  )
);

create policy "course lesson assets admins update"
on public.course_lesson_assets
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_memberships a
    where a.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_memberships a
    where a.user_id = (select auth.uid())
  )
);

create policy "course lesson assets admins delete"
on public.course_lesson_assets
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_memberships a
    where a.user_id = (select auth.uid())
  )
);
