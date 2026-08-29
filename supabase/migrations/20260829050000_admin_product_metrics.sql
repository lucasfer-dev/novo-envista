-- Operational product metrics for the private Admin dashboard.
-- One server-side aggregate avoids fan-out queries as the dataset grows.

create or replace function public.admin_product_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_7d timestamptz := statement_timestamp() - interval '7 days';
  v_30d timestamptz := statement_timestamp() - interval '30 days';
begin
  if not exists (
    select 1
    from public.admin_memberships a
    where a.user_id = auth.uid()
  ) then
    raise exception 'admin_required' using errcode = '42501';
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

revoke all on function public.admin_product_metrics() from public, anon;
grant execute on function public.admin_product_metrics() to authenticated;
