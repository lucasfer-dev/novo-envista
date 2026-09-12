-- Make beta-funnel telemetry authoritative by deriving events from successful domain writes.

alter table public.product_events
  add column if not exists subject_type text,
  add column if not exists subject_id uuid;

alter table public.product_events drop constraint if exists product_events_subject_type_check;
alter table public.product_events add constraint product_events_subject_type_check
  check (subject_type is null or subject_type in ('account','project','team','course','verification','interest','conversation'));

create unique index if not exists product_events_user_event_subject_uq
  on public.product_events(user_id,event_name,subject_id)
  where subject_id is not null;

revoke insert on public.product_events from authenticated;
drop policy if exists product_events_insert_self on public.product_events;

create or replace function private.track_product_insert_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  uid uuid;
  sid uuid;
  event_name_arg text := tg_argv[1];
  subject_type_arg text := tg_argv[3];
begin
  uid := nullif(to_jsonb(new)->>tg_argv[0], '')::uuid;
  sid := nullif(to_jsonb(new)->>tg_argv[2], '')::uuid;
  if uid is not null and sid is not null then
    insert into public.product_events(user_id,event_name,subject_type,subject_id)
    values(uid,event_name_arg,subject_type_arg,sid)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.track_product_insert_event() from public, anon, authenticated;

create or replace function private.track_course_completion_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  course uuid;
  total_lessons bigint;
  completed_lessons bigint;
begin
  select m.course_id into course
  from public.course_lessons l
  join public.course_modules m on m.id=l.module_id
  where l.id=new.lesson_id;

  if course is null then return new; end if;

  select count(*) into total_lessons
  from public.course_lessons l
  join public.course_modules m on m.id=l.module_id
  where m.course_id=course;

  select count(*) into completed_lessons
  from public.lesson_progress lp
  join public.course_lessons l on l.id=lp.lesson_id
  join public.course_modules m on m.id=l.module_id
  where m.course_id=course and lp.user_id=new.user_id;

  if total_lessons > 0 and completed_lessons >= total_lessons then
    insert into public.product_events(user_id,event_name,subject_type,subject_id)
    values(new.user_id,'course_completed','course',course)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.track_course_completion_event() from public, anon, authenticated;

-- Track successful domain writes rather than UI clicks.
drop trigger if exists analytics_onboarding_completed on public.onboarding_completions;
create trigger analytics_onboarding_completed after insert on public.onboarding_completions
for each row execute function private.track_product_insert_event('user_id','onboarding_completed','user_id','account');

drop trigger if exists analytics_project_created on public.projects;
create trigger analytics_project_created after insert on public.projects
for each row execute function private.track_product_insert_event('created_by','project_created','id','project');

drop trigger if exists analytics_team_created on public.teams;
create trigger analytics_team_created after insert on public.teams
for each row execute function private.track_product_insert_event('owner_id','team_created','id','team');

drop trigger if exists analytics_course_started on public.course_enrollments;
create trigger analytics_course_started after insert on public.course_enrollments
for each row execute function private.track_product_insert_event('user_id','course_started','course_id','course');

drop trigger if exists analytics_course_completed on public.lesson_progress;
create trigger analytics_course_completed after insert on public.lesson_progress
for each row execute function private.track_course_completion_event();

drop trigger if exists analytics_investor_verification_requested on public.investor_verifications;
create trigger analytics_investor_verification_requested after insert on public.investor_verifications
for each row when (new.status='pending') execute function private.track_product_insert_event('user_id','investor_verification_requested','user_id','verification');

drop trigger if exists analytics_investor_interest_created on public.project_interests;
create trigger analytics_investor_interest_created after insert on public.project_interests
for each row execute function private.track_product_insert_event('investor_id','investor_interest_created','id','interest');

drop trigger if exists analytics_message_started on public.direct_conversations;
create trigger analytics_message_started after insert on public.direct_conversations
for each row execute function private.track_product_insert_event('created_by','message_started','id','conversation');

comment on function private.track_product_insert_event() is
  'Authoritative beta-funnel tracking from successful domain inserts; not callable by API roles.';
comment on function private.track_course_completion_event() is
  'Records course completion when the final lesson progress row is successfully persisted.';
