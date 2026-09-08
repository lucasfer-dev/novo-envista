-- Remove the exposed SECURITY DEFINER surface from admin_product_metrics.
-- Admins receive explicit read access through RLS on the aggregate's remaining
-- user-scoped source tables, then the RPC executes with the caller privileges.

create policy course_enrollments_select_admin
on public.course_enrollments
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_memberships admin
    where admin.user_id = (select auth.uid())
  )
);

create policy lesson_progress_select_admin
on public.lesson_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_memberships admin
    where admin.user_id = (select auth.uid())
  )
);

create policy project_interests_select_admin
on public.project_interests
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_memberships admin
    where admin.user_id = (select auth.uid())
  )
);

create policy project_saves_select_admin
on public.project_saves
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_memberships admin
    where admin.user_id = (select auth.uid())
  )
);

alter function public.admin_product_metrics() security invoker;

revoke all on function public.admin_product_metrics() from public, anon;
grant execute on function public.admin_product_metrics() to authenticated;
