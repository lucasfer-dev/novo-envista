create index if not exists course_lesson_assets_uploaded_by_idx
  on public.course_lesson_assets (uploaded_by);

alter policy "course lesson assets admins manage" on public.course_lesson_assets
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

alter policy "course lesson assets enrolled read" on public.course_lesson_assets
using (
  exists (
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
