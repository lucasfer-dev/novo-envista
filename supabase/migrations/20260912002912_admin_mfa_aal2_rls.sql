-- Require a verified MFA session (aal2) for every administrative privilege.
-- Self-service access to admin_memberships remains aal1-readable so an admin can
-- be identified and redirected into the MFA enrollment/challenge flow.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt()->>'aal') = 'aal2', false)
    and exists (
      select 1
      from public.admin_memberships a
      where a.user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter policy account_compliance_select_self_or_admin on public.account_compliance
using (user_id = (select auth.uid()) or (select private.is_admin()));

alter policy admin_audit_select_admin on public.admin_audit_log
using ((select private.is_admin()));
alter policy admin_audit_insert_admin_self on public.admin_audit_log
with check (admin_user_id = (select auth.uid()) and (select private.is_admin()));

alter policy content_reports_select_own_or_admin on public.content_reports
using (reporter_id = (select auth.uid()) or (select private.is_admin()));
alter policy content_reports_update_admin on public.content_reports
using ((select private.is_admin()))
with check ((select private.is_admin()));

alter policy course_enrollments_select_own_or_admin on public.course_enrollments
using (user_id = (select auth.uid()) or (select private.is_admin()));

alter policy course_lessons_admin_delete on public.course_lessons
using ((select private.is_admin()));
alter policy course_lessons_admin_insert on public.course_lessons
with check ((select private.is_admin()));
alter policy course_lessons_admin_update on public.course_lessons
using ((select private.is_admin()))
with check ((select private.is_admin()));
alter policy course_lessons_select_published_or_admin on public.course_lessons
using (
  exists (
    select 1
    from public.course_modules m
    join public.courses c on c.id = m.course_id
    where m.id = course_lessons.module_id and c.status = 'published'
  )
  or (select private.is_admin())
);

alter policy course_modules_admin_delete on public.course_modules
using ((select private.is_admin()));
alter policy course_modules_admin_insert on public.course_modules
with check ((select private.is_admin()));
alter policy course_modules_admin_update on public.course_modules
using ((select private.is_admin()))
with check ((select private.is_admin()));
alter policy course_modules_select_published_or_admin on public.course_modules
using (
  exists (
    select 1 from public.courses c
    where c.id = course_modules.course_id and c.status = 'published'
  )
  or (select private.is_admin())
);

alter policy courses_admin_delete on public.courses
using ((select private.is_admin()));
alter policy courses_admin_insert on public.courses
with check ((select private.is_admin()));
alter policy courses_admin_update on public.courses
using ((select private.is_admin()))
with check ((select private.is_admin()));
alter policy courses_select_published_or_admin on public.courses
using (status = 'published' or (select private.is_admin()));

alter policy direct_messages_select_participant_or_reported_admin on public.direct_messages
using (
  exists (
    select 1 from public.direct_conversations c
    where c.id = direct_messages.conversation_id
      and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
  )
  or (
    (select private.is_admin())
    and exists (select 1 from public.message_reports r where r.message_id = direct_messages.id)
  )
);

alter policy lesson_progress_select_own_or_admin on public.lesson_progress
using (user_id = (select auth.uid()) or (select private.is_admin()));

alter policy message_reports_select_own_or_admin on public.message_reports
using (reporter_id = (select auth.uid()) or (select private.is_admin()));
alter policy message_reports_update_admin on public.message_reports
using ((select private.is_admin()))
with check ((select private.is_admin()));

alter policy posts_select_visible_or_admin on public.posts
using (private.can_view_post(id) or (select private.is_admin()));

alter policy privacy_requests_select_own_or_admin on public.privacy_requests
using (user_id = (select auth.uid()) or (select private.is_admin()));
alter policy privacy_requests_update_admin on public.privacy_requests
using ((select private.is_admin()))
with check ((select private.is_admin()));

alter policy profiles_select_visible_colleague_or_admin on public.profiles
using (
  id = (select auth.uid())
  or profile_visibility = 'platform'::public.profile_visibility
  or private.shares_team_with(id)
  or (select private.is_admin())
);

alter policy project_interests_select_involved_or_admin on public.project_interests
using (
  investor_id = (select auth.uid())
  or exists (
    select 1 from public.projects p
    where p.id = project_interests.project_id
      and (
        p.owner_user_id = (select auth.uid())
        or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id, (select auth.uid())))
      )
  )
  or (select private.is_admin())
);

alter policy project_saves_select_self_or_admin on public.project_saves
using (user_id = (select auth.uid()) or (select private.is_admin()));

alter policy projects_select_visible_or_admin on public.projects
using (private.can_view_project(id) or (select private.is_admin()));

alter policy teams_select_visible_or_admin on public.teams
using (
  visibility = 'platform'
  or owner_id = (select auth.uid())
  or private.is_team_member(id)
  or (select private.is_admin())
);

-- The function is SECURITY INVOKER, so the same RLS protection applies to its
-- aggregates. Require aal2 before any metric work begins as defense in depth.
create or replace function public.admin_product_metrics()
returns jsonb
language plpgsql
stable
security invoker
set search_path = 'pg_catalog', 'public'
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_7d timestamptz := statement_timestamp() - interval '7 days';
  v_30d timestamptz := statement_timestamp() - interval '30 days';
begin
  if not (select private.is_admin()) then
    raise exception 'admin_mfa_required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'generated_at', v_now,
    'totals', jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'participants', (select count(*) from public.profiles where role = 'participant'),
      'investors', (select count(*) from public.profiles where role = 'investor'),
      'teams', (select count(*) from public.teams),
      'projects', (select count(*) from public.projects),
      'posts', (select count(*) from public.posts),
      'project_saves', (select count(*) from public.project_saves),
      'project_interests', (select count(*) from public.project_interests),
      'course_enrollments', (select count(*) from public.course_enrollments),
      'lesson_completions', (select count(*) from public.lesson_progress where completed_at is not null),
      'open_content_reports', (select count(*) from public.content_reports where status in ('open','reviewing')),
      'open_message_reports', (select count(*) from public.message_reports where status in ('open','reviewing'))
    ),
    'last_30_days', jsonb_build_object(
      'users', (select count(*) from public.profiles where created_at >= v_30d),
      'teams', (select count(*) from public.teams where created_at >= v_30d),
      'projects', (select count(*) from public.projects where created_at >= v_30d),
      'posts', (select count(*) from public.posts where created_at >= v_30d),
      'project_saves', (select count(*) from public.project_saves where created_at >= v_30d),
      'project_interests', (select count(*) from public.project_interests where created_at >= v_30d),
      'course_enrollments', (select count(*) from public.course_enrollments where enrolled_at >= v_30d),
      'lesson_completions', (select count(*) from public.lesson_progress where completed_at >= v_30d),
      'content_reports', (select count(*) from public.content_reports where created_at >= v_30d),
      'message_reports', (select count(*) from public.message_reports where created_at >= v_30d)
    ),
    'last_7_days', jsonb_build_object(
      'users', (select count(*) from public.profiles where created_at >= v_7d),
      'teams', (select count(*) from public.teams where created_at >= v_7d),
      'projects', (select count(*) from public.projects where created_at >= v_7d),
      'posts', (select count(*) from public.posts where created_at >= v_7d),
      'project_saves', (select count(*) from public.project_saves where created_at >= v_7d),
      'project_interests', (select count(*) from public.project_interests where created_at >= v_7d),
      'course_enrollments', (select count(*) from public.course_enrollments where enrolled_at >= v_7d),
      'lesson_completions', (select count(*) from public.lesson_progress where completed_at >= v_7d)
    )
  );
end;
$$;
