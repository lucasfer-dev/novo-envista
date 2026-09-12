-- Professional product suite: workspace, profile credibility, preferences, feedback and public sharing.

alter table public.profiles
  add column if not exists headline text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists website_url text;

alter table public.profiles drop constraint if exists profiles_headline_len;
alter table public.profiles add constraint profiles_headline_len check (headline is null or char_length(headline) <= 140);
alter table public.profiles drop constraint if exists profiles_github_url_len;
alter table public.profiles add constraint profiles_github_url_len check (github_url is null or char_length(github_url) <= 500);
alter table public.profiles drop constraint if exists profiles_linkedin_url_len;
alter table public.profiles add constraint profiles_linkedin_url_len check (linkedin_url is null or char_length(linkedin_url) <= 500);
alter table public.profiles drop constraint if exists profiles_website_url_len;
alter table public.profiles add constraint profiles_website_url_len check (website_url is null or char_length(website_url) <= 500);

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade, assignee_id uuid references auth.users(id) on delete set null,
  title text not null, description text not null default '', status text not null default 'todo' check (status in ('todo','doing','done')),
  due_date date, position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint team_tasks_title_len check (char_length(title) between 2 and 140), constraint team_tasks_description_len check (char_length(description) <= 700)
);
create index if not exists team_tasks_team_status_idx on public.team_tasks(team_id,status,position,created_at desc);
alter table public.team_tasks enable row level security;
revoke all on public.team_tasks from anon, authenticated; grant select, insert, update, delete on public.team_tasks to authenticated;
drop policy if exists team_tasks_member_select on public.team_tasks;
create policy team_tasks_member_select on public.team_tasks for select to authenticated using (private.is_team_member(team_id,(select auth.uid())) or (select private.is_admin()));
drop policy if exists team_tasks_member_insert on public.team_tasks;
create policy team_tasks_member_insert on public.team_tasks for insert to authenticated with check (created_by=(select auth.uid()) and private.is_team_member(team_id,(select auth.uid())));
drop policy if exists team_tasks_member_update on public.team_tasks;
create policy team_tasks_member_update on public.team_tasks for update to authenticated using (private.is_team_member(team_id,(select auth.uid())) or (select private.is_admin())) with check (private.is_team_member(team_id,(select auth.uid())) or (select private.is_admin()));
drop policy if exists team_tasks_member_delete on public.team_tasks;
create policy team_tasks_member_delete on public.team_tasks for delete to authenticated using (private.is_team_member(team_id,(select auth.uid())) or created_by=(select auth.uid()) or (select private.is_admin()));

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  social boolean not null default true, teams boolean not null default true, projects boolean not null default true,
  messages boolean not null default true, investor_activity boolean not null default true, saved_project_updates boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated; grant select, insert, update on public.notification_preferences to authenticated;
drop policy if exists notification_preferences_own_select on public.notification_preferences;
create policy notification_preferences_own_select on public.notification_preferences for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists notification_preferences_own_insert on public.notification_preferences;
create policy notification_preferences_own_insert on public.notification_preferences for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists notification_preferences_own_update on public.notification_preferences;
create policy notification_preferences_own_update on public.notification_preferences for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create table if not exists public.feedback_tickets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'feedback' check (category in ('feedback','bug','idea','support')), message text not null,
  page_path text not null default '/', status text not null default 'open' check (status in ('open','reviewing','resolved','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint feedback_tickets_message_len check (char_length(message) between 5 and 3000),
  constraint feedback_tickets_path_len check (char_length(page_path) between 1 and 500 and page_path like '/%')
);
create index if not exists feedback_tickets_user_created_idx on public.feedback_tickets(user_id,created_at desc);
alter table public.feedback_tickets enable row level security;
revoke all on public.feedback_tickets from anon, authenticated; grant select, insert on public.feedback_tickets to authenticated; grant update (status,updated_at) on public.feedback_tickets to authenticated;
drop policy if exists feedback_tickets_own_select on public.feedback_tickets;
create policy feedback_tickets_own_select on public.feedback_tickets for select to authenticated using (user_id=(select auth.uid()) or (select private.is_admin()));
drop policy if exists feedback_tickets_own_insert on public.feedback_tickets;
create policy feedback_tickets_own_insert on public.feedback_tickets for insert to authenticated with check (user_id=(select auth.uid()) and status='open');
drop policy if exists feedback_tickets_admin_update on public.feedback_tickets;
create policy feedback_tickets_admin_update on public.feedback_tickets for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create or replace function private.notify_saved_project_watchers()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare watcher record; base text; actor uuid:=auth.uid();
begin
  if new.updated_at is not distinct from old.updated_at then return new; end if;
  for watcher in
    select ps.user_id from public.project_saves ps
    left join public.notification_preferences np on np.user_id=ps.user_id
    where ps.project_id=new.id and ps.user_id is distinct from actor and coalesce(np.saved_project_updates,true)
      and not exists(select 1 from public.follows f where f.follower_id=ps.user_id and f.target_project_id=new.id)
  loop
    base:=private.notification_prefix(watcher.user_id);
    insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
    values(watcher.user_id,'saved_project_update',actor,'Projeto salvo foi atualizado',new.title||' recebeu novidades desde a última vez que você viu.',coalesce(base,'/app')||'/projects/'||new.slug);
  end loop;
  return new;
end;$$;
revoke all on function private.notify_saved_project_watchers() from public,anon,authenticated;
drop trigger if exists notifications_saved_project_update on public.projects;
create trigger notifications_saved_project_update after update on public.projects for each row execute function private.notify_saved_project_watchers();

create or replace function public.get_public_project_share(project_slug text)
returns jsonb language sql stable security definer set search_path=pg_catalog,public as $$
  select jsonb_build_object(
    'id',p.id,'slug',p.slug,'title',p.title,'short_description',p.short_description,
    'description',case when nullif(p.readme,'') is not null then p.readme else concat_ws(E'\n\n',nullif(p.problem,''),nullif(p.solution,'')) end,
    'stage',p.stage,'category',p.category,'location',p.location,'tags',p.tags,'updated_at',p.updated_at,
    'owner',case when pr.id is not null then jsonb_build_object('name',pr.display_name,'username',pr.username,'headline',pr.headline) else null end,
    'team',case when t.id is not null then jsonb_build_object('name',t.name,'slug',t.slug) else null end
  )
  from public.projects p left join public.profiles pr on pr.id=p.owner_user_id left join public.teams t on t.id=p.owner_team_id
  where p.slug=project_slug and p.visibility='platform' limit 1;
$$;
revoke all on function public.get_public_project_share(text) from public;
grant execute on function public.get_public_project_share(text) to anon,authenticated;

do $$begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='team_tasks') then
    execute 'alter publication supabase_realtime add table public.team_tasks';
  end if;
end$$;
