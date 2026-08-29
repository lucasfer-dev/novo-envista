-- Public-content reporting and moderation queue.
-- Extends the existing message-only moderation without exposing private chats.

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile','post','project','team')),
  target_id uuid not null,
  reason text not null check (reason in ('spam','harassment','impersonation','unsafe','privacy','misleading','other')),
  details text not null default '' check (char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  admin_note text not null default '' check (char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists content_reports_created_idx
  on public.content_reports(created_at desc);
create index if not exists content_reports_status_idx
  on public.content_reports(status, created_at desc);
create index if not exists content_reports_target_idx
  on public.content_reports(target_type, target_id);
create unique index if not exists content_reports_one_active_per_reporter_target_idx
  on public.content_reports(reporter_id, target_type, target_id)
  where status in ('open','reviewing');

alter table public.content_reports enable row level security;

revoke all on table public.content_reports from public, anon;
grant select, insert, update on table public.content_reports to authenticated;

drop policy if exists content_reports_insert_own_visible_target on public.content_reports;
create policy content_reports_insert_own_visible_target
on public.content_reports
for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and status = 'open'
  and admin_note = ''
  and resolved_at is null
  and case target_type
    when 'profile' then exists (
      select 1 from public.profiles target
      where target.id = content_reports.target_id
        and target.id <> (select auth.uid())
    )
    when 'post' then exists (
      select 1 from public.posts target
      where target.id = content_reports.target_id
    )
    when 'project' then exists (
      select 1 from public.projects target
      where target.id = content_reports.target_id
    )
    when 'team' then exists (
      select 1 from public.teams target
      where target.id = content_reports.target_id
    )
    else false
  end
);

drop policy if exists content_reports_select_own on public.content_reports;
create policy content_reports_select_own
on public.content_reports
for select
to authenticated
using (reporter_id = (select auth.uid()));

drop policy if exists content_reports_select_admin on public.content_reports;
create policy content_reports_select_admin
on public.content_reports
for select
to authenticated
using (
  exists (
    select 1 from public.admin_memberships admin
    where admin.user_id = (select auth.uid())
  )
);

drop policy if exists content_reports_update_admin on public.content_reports;
create policy content_reports_update_admin
on public.content_reports
for update
to authenticated
using (
  exists (
    select 1 from public.admin_memberships admin
    where admin.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_memberships admin
    where admin.user_id = (select auth.uid())
  )
);

-- The existing authoritative DB quota infrastructure throttles report spam too.
drop trigger if exists abuse_limit_content_reports on public.content_reports;
create trigger abuse_limit_content_reports
before insert on public.content_reports
for each row execute function private.enforce_write_rate_limit('content_reports', '20', '86400');

-- Admins can inspect a public-content target only when a report points to it.
-- This mirrors the privacy-preserving rule already used for reported messages.
drop policy if exists profiles_select_reported_admin on public.profiles;
create policy profiles_select_reported_admin
on public.profiles
for select
to authenticated
using (
  exists (select 1 from public.admin_memberships admin where admin.user_id = (select auth.uid()))
  and exists (
    select 1 from public.content_reports report
    where report.target_type = 'profile' and report.target_id = profiles.id
  )
);

drop policy if exists posts_select_reported_admin on public.posts;
create policy posts_select_reported_admin
on public.posts
for select
to authenticated
using (
  exists (select 1 from public.admin_memberships admin where admin.user_id = (select auth.uid()))
  and exists (
    select 1 from public.content_reports report
    where report.target_type = 'post' and report.target_id = posts.id
  )
);

drop policy if exists projects_select_reported_admin on public.projects;
create policy projects_select_reported_admin
on public.projects
for select
to authenticated
using (
  exists (select 1 from public.admin_memberships admin where admin.user_id = (select auth.uid()))
  and exists (
    select 1 from public.content_reports report
    where report.target_type = 'project' and report.target_id = projects.id
  )
);

drop policy if exists teams_select_reported_admin on public.teams;
create policy teams_select_reported_admin
on public.teams
for select
to authenticated
using (
  exists (select 1 from public.admin_memberships admin where admin.user_id = (select auth.uid()))
  and exists (
    select 1 from public.content_reports report
    where report.target_type = 'team' and report.target_id = teams.id
  )
);
