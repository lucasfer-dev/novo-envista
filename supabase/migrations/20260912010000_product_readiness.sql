-- Product-readiness schema for investor verification, project interest pipeline and aggregate analytics.
-- Written idempotently because the production database received these guarded changes first.

alter table public.project_interests
  add column if not exists owner_status text not null default 'new',
  add column if not exists owner_status_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_interests_owner_status_check'
      and conrelid = 'public.project_interests'::regclass
  ) then
    alter table public.project_interests
      add constraint project_interests_owner_status_check
      check (owner_status in ('new','viewed','contacted','meeting','closed'));
  end if;
end $$;

create index if not exists project_interests_owner_status_idx
  on public.project_interests (project_id, owner_status, updated_at desc);

create table if not exists public.investor_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'not_requested' check (status in ('not_requested','pending','verified','rejected')),
  organization_name text not null default '',
  organization_type text not null default '',
  website_url text not null default '',
  review_note text not null default '',
  requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investor_verifications_org_name_len check (char_length(organization_name) <= 160),
  constraint investor_verifications_org_type_len check (char_length(organization_type) <= 100),
  constraint investor_verifications_url_len check (char_length(website_url) <= 500),
  constraint investor_verifications_note_len check (char_length(review_note) <= 1000)
);
create index if not exists investor_verifications_reviewed_by_idx on public.investor_verifications(reviewed_by);
alter table public.investor_verifications enable row level security;

drop policy if exists investor_verifications_select_self_or_admin on public.investor_verifications;
create policy investor_verifications_select_self_or_admin on public.investor_verifications for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists investor_verifications_insert_self on public.investor_verifications;
create policy investor_verifications_insert_self on public.investor_verifications for insert to authenticated
with check (
  user_id = (select auth.uid()) and status = 'pending'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'investor'::public.account_role)
);

drop policy if exists investor_verifications_update_self_or_admin on public.investor_verifications;
create policy investor_verifications_update_self_or_admin on public.investor_verifications for update to authenticated
using ((user_id = (select auth.uid()) and status in ('not_requested','rejected')) or (select private.is_admin()))
with check ((user_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null) or (select private.is_admin()));

grant select, insert, update on public.investor_verifications to authenticated;

create table if not exists public.project_view_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'project',
  view_date date not null default current_date,
  viewed_at timestamptz not null default now(),
  constraint project_view_events_source_len check (char_length(source) between 1 and 40),
  unique (project_id, viewer_id, view_date)
);
create index if not exists project_view_events_project_date_idx on public.project_view_events(project_id, viewed_at desc);
create index if not exists project_view_events_viewer_date_idx on public.project_view_events(viewer_id, viewed_at desc);
alter table public.project_view_events enable row level security;

drop policy if exists project_view_events_insert_own on public.project_view_events;
create policy project_view_events_insert_own on public.project_view_events for insert to authenticated
with check (viewer_id = (select auth.uid()) and private.can_view_project(project_id));

drop policy if exists project_view_events_select_own_or_admin on public.project_view_events;
create policy project_view_events_select_own_or_admin on public.project_view_events for select to authenticated
using (viewer_id = (select auth.uid()) or (select private.is_admin()));
grant select, insert on public.project_view_events to authenticated;

create table if not exists public.project_metrics (
  project_id uuid primary key references public.projects(id) on delete cascade,
  view_count bigint not null default 0 check (view_count >= 0),
  last_viewed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.project_metrics enable row level security;

drop policy if exists project_metrics_select_owner_or_admin on public.project_metrics;
create policy project_metrics_select_owner_or_admin on public.project_metrics for select to authenticated
using (
  exists (
    select 1 from public.projects p where p.id = project_metrics.project_id
      and (p.owner_user_id = (select auth.uid()) or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id, (select auth.uid()))))
  ) or (select private.is_admin())
);
grant select on public.project_metrics to authenticated;

create or replace function private.bump_project_view_metric()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_metrics(project_id,view_count,last_viewed_at,updated_at)
  values(new.project_id,1,new.viewed_at,now())
  on conflict(project_id) do update set
    view_count = public.project_metrics.view_count + 1,
    last_viewed_at = greatest(public.project_metrics.last_viewed_at, excluded.last_viewed_at),
    updated_at = now();
  return new;
end;
$$;
revoke all on function private.bump_project_view_metric() from public;
drop trigger if exists project_view_events_bump_metric on public.project_view_events;
create trigger project_view_events_bump_metric after insert on public.project_view_events
for each row execute function private.bump_project_view_metric();

create or replace function private.guard_project_interest_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); is_owner boolean := false;
begin
  if (select private.is_admin()) then
    if new.owner_status is distinct from old.owner_status then new.owner_status_updated_at := now(); end if;
    new.updated_at := now(); return new;
  end if;
  if uid is null then raise exception using errcode='42501', message='authentication required'; end if;
  if old.investor_id = uid then
    if new.investor_id is distinct from old.investor_id or new.project_id is distinct from old.project_id
      or new.owner_status is distinct from old.owner_status or new.owner_status_updated_at is distinct from old.owner_status_updated_at
    then raise exception using errcode='42501', message='investor cannot modify owner pipeline state'; end if;
    new.updated_at := now(); return new;
  end if;
  select exists(select 1 from public.projects p where p.id=old.project_id and (p.owner_user_id=uid or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id,uid)))) into is_owner;
  if is_owner then
    if new.investor_id is distinct from old.investor_id or new.project_id is distinct from old.project_id
      or new.message is distinct from old.message or new.status is distinct from old.status
    then raise exception using errcode='42501', message='project owner can only modify pipeline state'; end if;
    if new.owner_status is distinct from old.owner_status then new.owner_status_updated_at := now(); end if;
    new.updated_at := now(); return new;
  end if;
  raise exception using errcode='42501', message='not allowed to update this interest';
end;
$$;
revoke all on function private.guard_project_interest_update() from public;
drop trigger if exists project_interests_guard_update on public.project_interests;
create trigger project_interests_guard_update before update on public.project_interests
for each row execute function private.guard_project_interest_update();

drop policy if exists project_interests_update_own on public.project_interests;
drop policy if exists project_interests_update_project_owner on public.project_interests;
drop policy if exists project_interests_update_involved_or_admin on public.project_interests;
create policy project_interests_update_involved_or_admin on public.project_interests for update to authenticated
using (
  investor_id = (select auth.uid())
  or exists(select 1 from public.projects p where p.id=project_interests.project_id and (p.owner_user_id=(select auth.uid()) or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id,(select auth.uid())))))
  or (select private.is_admin())
)
with check (
  investor_id = (select auth.uid())
  or exists(select 1 from public.projects p where p.id=project_interests.project_id and (p.owner_user_id=(select auth.uid()) or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id,(select auth.uid())))))
  or (select private.is_admin())
);

drop policy if exists project_interests_insert_investor on public.project_interests;
create policy project_interests_insert_investor on public.project_interests for insert to authenticated
with check (
  investor_id=(select auth.uid()) and status='active' and owner_status='new'
  and exists(select 1 from public.profiles pr where pr.id=(select auth.uid()) and pr.role='investor'::public.account_role)
  and exists(select 1 from public.investor_verifications iv where iv.user_id=(select auth.uid()) and iv.status='verified')
  and exists(select 1 from public.projects p where p.id=project_interests.project_id and p.visibility='platform')
);

-- Owners of a project may see the profile of an investor who contacted that project.
drop policy if exists profiles_select_visible_colleague_or_admin on public.profiles;
create policy profiles_select_visible_colleague_or_admin on public.profiles for select to authenticated
using (
  id=(select auth.uid()) or profile_visibility='platform'::public.profile_visibility or private.shares_team_with(id)
  or exists(
    select 1 from public.project_interests pi join public.projects p on p.id=pi.project_id
    where pi.investor_id=profiles.id and (p.owner_user_id=(select auth.uid()) or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id,(select auth.uid()))))
  )
  or (select private.is_admin())
);

-- Administrative review may notify the reviewed account.
drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin on public.notifications for insert to authenticated
with check ((select private.is_admin()));

-- Launch legal document versions.
update public.legal_documents set active=false where document_type in ('terms','privacy') and active=true;
insert into public.legal_documents(document_type,document_version,active,audience,published_at)
values ('terms','2026-09-11-v1',true,'public',now()),('privacy','2026-09-11-v1',true,'public',now())
on conflict(document_type,document_version) do update
set active=excluded.active,audience=excluded.audience,published_at=excluded.published_at;
