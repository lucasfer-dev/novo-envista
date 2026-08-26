-- Projetos reais: autoria pessoal ou por equipe, com RLS baseado em identidade real.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 90),
  title text not null check (char_length(title) between 2 and 140),
  short_description text not null default '' check (char_length(short_description) <= 320),
  problem text not null default '' check (char_length(problem) <= 4000),
  solution text not null default '' check (char_length(solution) <= 4000),
  stage text not null default 'Ideia' check (stage in ('Ideia','Validação','Protótipo','MVP','Projeto ativo')),
  category text not null default '' check (char_length(category) <= 100),
  location text not null default '' check (char_length(location) <= 160),
  tags text[] not null default '{}',
  readme text not null default '' check (char_length(readme) <= 20000),
  cover_path text,
  visibility text not null default 'platform' check (visibility in ('private','platform')),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  owner_team_id uuid references public.teams(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_user_id is not null)::int + (owner_team_id is not null)::int = 1)
);

create index if not exists projects_owner_user_idx on public.projects(owner_user_id);
create index if not exists projects_owner_team_idx on public.projects(owner_team_id);
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists projects_visibility_stage_idx on public.projects(visibility, stage);

create or replace function private.can_view_project(target_project uuid, viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project
      and (
        p.visibility = 'platform'
        or p.owner_user_id = viewer
        or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id, viewer))
      )
  );
$$;

create or replace function private.can_edit_project(target_project uuid, viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project
      and (
        p.owner_user_id = viewer
        or (p.owner_team_id is not null and private.is_team_member(p.owner_team_id, viewer))
      )
  );
$$;

create or replace function private.can_delete_project(target_project uuid, viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project
      and (
        p.owner_user_id = viewer
        or (p.owner_team_id is not null and private.can_manage_team(p.owner_team_id, viewer))
      )
  );
$$;

create or replace function private.project_protect_ownership()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.owner_user_id is distinct from old.owner_user_id
     or new.owner_team_id is distinct from old.owner_team_id
     or new.created_by is distinct from old.created_by then
    raise exception 'project ownership is immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_protect_ownership on public.projects;
create trigger projects_protect_ownership before update on public.projects
for each row execute function private.project_protect_ownership();

alter table public.projects enable row level security;
revoke all on public.projects from anon;
revoke all on public.projects from authenticated;
grant select, insert, update, delete on public.projects to authenticated;

revoke all on function private.can_view_project(uuid, uuid) from public;
revoke all on function private.can_edit_project(uuid, uuid) from public;
revoke all on function private.can_delete_project(uuid, uuid) from public;
grant execute on function private.can_view_project(uuid, uuid) to authenticated;
grant execute on function private.can_edit_project(uuid, uuid) to authenticated;
grant execute on function private.can_delete_project(uuid, uuid) to authenticated;

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated
using (private.can_view_project(id));

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    owner_user_id = (select auth.uid())
    or (owner_team_id is not null and private.is_team_member(owner_team_id))
  )
);

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated
using (private.can_edit_project(id))
with check (private.can_edit_project(id));

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated
using (private.can_delete_project(id));
