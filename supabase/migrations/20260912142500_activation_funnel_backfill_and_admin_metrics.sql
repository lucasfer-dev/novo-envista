-- Backfill authoritative activation events and expose aggregate funnel counts to the admin dashboard.

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select user_id,'onboarding_completed','account',user_id,completed_at from public.onboarding_completions
on conflict do nothing;

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select created_by,'project_created','project',id,created_at from public.projects
on conflict do nothing;

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select owner_id,'team_created','team',id,created_at from public.teams
on conflict do nothing;

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select user_id,'course_started','course',course_id,enrolled_at from public.course_enrollments
on conflict do nothing;

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select lp.user_id,'course_completed','course',m.course_id,max(lp.completed_at)
from public.lesson_progress lp
join public.course_lessons l on l.id=lp.lesson_id
join public.course_modules m on m.id=l.module_id
where lp.completed_at is not null
group by lp.user_id,m.course_id
having count(*) >= (
  select count(*)
  from public.course_lessons l2
  join public.course_modules m2 on m2.id=l2.module_id
  where m2.course_id=m.course_id
)
on conflict do nothing;

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select user_id,'investor_verification_requested','verification',user_id,coalesce(requested_at,created_at)
from public.investor_verifications
where status <> 'not_requested' or requested_at is not null
on conflict do nothing;

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select investor_id,'investor_interest_created','interest',id,created_at from public.project_interests
on conflict do nothing;

insert into public.product_events(user_id,event_name,subject_type,subject_id,created_at)
select created_by,'message_started','conversation',id,created_at from public.direct_conversations
on conflict do nothing;

create or replace function public.admin_product_metrics()
returns jsonb
language plpgsql
stable
set search_path = pg_catalog, public
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
    'activation_funnel', jsonb_build_object(
      'onboarding_completed', (select count(distinct user_id) from public.product_events where event_name='onboarding_completed'),
      'project_created', (select count(distinct user_id) from public.product_events where event_name='project_created'),
      'team_created', (select count(distinct user_id) from public.product_events where event_name='team_created'),
      'course_started', (select count(distinct user_id) from public.product_events where event_name='course_started'),
      'course_completed', (select count(distinct user_id) from public.product_events where event_name='course_completed'),
      'investor_verification_requested', (select count(distinct user_id) from public.product_events where event_name='investor_verification_requested'),
      'investor_interest_created', (select count(distinct user_id) from public.product_events where event_name='investor_interest_created'),
      'message_started', (select count(distinct user_id) from public.product_events where event_name='message_started')
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
