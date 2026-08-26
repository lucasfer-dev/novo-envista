create table if not exists public.project_interests (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  message text not null default '',
  status text not null default 'active' check (status in ('active','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investor_id, project_id),
  check (char_length(message) <= 1200)
);

create index if not exists project_interests_project_idx on public.project_interests(project_id, created_at desc);
create index if not exists project_interests_investor_idx on public.project_interests(investor_id, created_at desc);

alter table public.project_interests enable row level security;
revoke all on public.project_interests from anon, authenticated;
grant select, insert, update, delete on public.project_interests to authenticated;

create policy project_interests_select_involved on public.project_interests
for select to authenticated
using (
  investor_id = (select auth.uid())
  or exists (
    select 1 from public.projects p
    where p.id = project_id
      and (
        p.owner_user_id = (select auth.uid())
        or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id, (select auth.uid())))
      )
  )
);

create policy project_interests_insert_investor on public.project_interests
for insert to authenticated
with check (
  investor_id = (select auth.uid())
  and status = 'active'
  and exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'investor')
  and exists (select 1 from public.projects p where p.id = project_id and p.visibility = 'platform')
);

create policy project_interests_update_own on public.project_interests
for update to authenticated
using (investor_id = (select auth.uid()))
with check (investor_id = (select auth.uid()));

create policy project_interests_delete_own on public.project_interests
for delete to authenticated
using (investor_id = (select auth.uid()));

create or replace function private.project_interest_touch()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  new.investor_id := old.investor_id;
  new.project_id := old.project_id;
  new.updated_at := now();
  return new;
end;$$;

drop trigger if exists project_interests_touch on public.project_interests;
create trigger project_interests_touch before update on public.project_interests for each row execute function private.project_interest_touch();

create or replace function private.notify_project_interest()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare target_user uuid; project_title text; project_slug text;
begin
  select coalesce(p.owner_user_id, t.owner_id), p.title, p.slug
    into target_user, project_title, project_slug
  from public.projects p
  left join public.teams t on t.id = p.owner_team_id
  where p.id = new.project_id;

  if target_user is null or target_user = new.investor_id then return new; end if;

  insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
  values(
    target_user,
    'project_interest',
    new.investor_id,
    'Novo interesse no projeto',
    'Um investidor demonstrou interesse em ' || coalesce(project_title, 'seu projeto') || '.',
    '/app/interests'
  );
  return new;
end;$$;

revoke all on function private.notify_project_interest() from public, anon, authenticated;
drop trigger if exists notifications_project_interest on public.project_interests;
create trigger notifications_project_interest after insert on public.project_interests for each row execute function private.notify_project_interest();
