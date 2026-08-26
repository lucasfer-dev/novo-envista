-- Equipes reais do Envista.
-- Toda tabela exposta nasce com RLS e menor privilégio.

create schema if not exists private;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  category text not null default '' check (char_length(category) <= 100),
  city text not null default '' check (char_length(city) <= 100),
  institution text not null default '' check (char_length(institution) <= 160),
  tags text[] not null default '{}',
  visibility text not null default 'platform' check (visibility in ('private','platform')),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_label text not null default 'Membro' check (char_length(role_label) between 1 and 80),
  access_level text not null default 'member' check (access_level in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  role_label text not null default 'Membro' check (char_length(role_label) between 1 and 80),
  access_level text not null default 'member' check (access_level in ('admin','member')),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (invitee_id <> invited_by)
);

create unique index if not exists team_invitations_pending_unique
  on public.team_invitations(team_id, invitee_id)
  where status = 'pending';
create index if not exists team_members_user_idx on public.team_members(user_id, team_id);
create index if not exists team_invitations_invitee_idx on public.team_invitations(invitee_id, status);
create index if not exists teams_owner_idx on public.teams(owner_id);

create or replace function private.is_team_member(target_team uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = target_team and m.user_id = target_user
  );
$$;

create or replace function private.can_manage_team(target_team uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.teams t
    where t.id = target_team and t.owner_id = target_user
  ) or exists (
    select 1 from public.team_members m
    where m.team_id = target_team and m.user_id = target_user and m.access_level in ('owner','admin')
  );
$$;

create or replace function private.team_after_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.team_members(team_id, user_id, role_label, access_level)
  values (new.id, new.owner_id, 'Responsável', 'owner')
  on conflict (team_id, user_id) do nothing;
  return new;
end;
$$;

create or replace function private.team_protect_owner()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'team owner is immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.team_member_protect_owner()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.access_level = 'owner' and (tg_op = 'DELETE' or new.access_level <> 'owner' or new.user_id <> old.user_id) then
    raise exception 'owner membership cannot be removed or downgraded';
  end if;
  if tg_op = 'UPDATE' and (new.team_id <> old.team_id or new.user_id <> old.user_id) then
    raise exception 'membership identity is immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.team_invitation_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor uuid := auth.uid();
begin
  if new.team_id <> old.team_id or new.invitee_id <> old.invitee_id or new.invited_by <> old.invited_by
     or new.role_label <> old.role_label or new.access_level <> old.access_level then
    raise exception 'invitation identity is immutable';
  end if;
  if old.status <> 'pending' then
    raise exception 'invitation already resolved';
  end if;
  if actor = old.invitee_id then
    if new.status not in ('accepted','declined') then raise exception 'invalid invitation response'; end if;
  elsif private.can_manage_team(old.team_id, actor) then
    if new.status <> 'cancelled' then raise exception 'manager can only cancel invitation'; end if;
  else
    raise exception 'not allowed';
  end if;
  new.responded_at := now();
  if new.status = 'accepted' then
    insert into public.team_members(team_id, user_id, role_label, access_level)
    values (old.team_id, old.invitee_id, old.role_label, old.access_level)
    on conflict (team_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists teams_after_insert on public.teams;
create trigger teams_after_insert after insert on public.teams
for each row execute function private.team_after_insert();

drop trigger if exists teams_protect_owner on public.teams;
create trigger teams_protect_owner before update on public.teams
for each row execute function private.team_protect_owner();

drop trigger if exists team_members_protect_owner on public.team_members;
create trigger team_members_protect_owner before update or delete on public.team_members
for each row execute function private.team_member_protect_owner();

drop trigger if exists team_invitations_transition on public.team_invitations;
create trigger team_invitations_transition before update on public.team_invitations
for each row execute function private.team_invitation_transition();

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;

revoke all on public.teams, public.team_members, public.team_invitations from anon;
revoke all on public.teams, public.team_members, public.team_invitations from authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.team_members to authenticated;
grant select, insert, update on public.team_invitations to authenticated;

revoke all on function private.is_team_member(uuid, uuid) from public;
revoke all on function private.can_manage_team(uuid, uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_team_member(uuid, uuid) to authenticated;
grant execute on function private.can_manage_team(uuid, uuid) to authenticated;

-- Equipes: leitura por membros ou por qualquer autenticado quando visível na plataforma.
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select to authenticated
using (visibility = 'platform' or owner_id = (select auth.uid()) or private.is_team_member(id));

drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
using (private.can_manage_team(id))
with check (private.can_manage_team(id) and owner_id = owner_id);

drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated
using (owner_id = (select auth.uid()));

-- Membros: detalhes de equipes visíveis na plataforma podem ser vistos por autenticados.
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated
using (
  private.is_team_member(team_id)
  or exists (select 1 from public.teams t where t.id = team_id and t.visibility = 'platform')
);

drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members for insert to authenticated
with check (
  private.can_manage_team(team_id)
  or (
    user_id = (select auth.uid()) and exists (
      select 1 from public.team_invitations i
      where i.team_id = team_id and i.invitee_id = (select auth.uid()) and i.status = 'accepted'
    )
  )
);

drop policy if exists team_members_update on public.team_members;
create policy team_members_update on public.team_members for update to authenticated
using (private.can_manage_team(team_id))
with check (private.can_manage_team(team_id));

drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete on public.team_members for delete to authenticated
using (private.can_manage_team(team_id) or user_id = (select auth.uid()));

-- Convites: somente gestores e o convidado conseguem ver; somente gestores criam.
drop policy if exists team_invitations_select on public.team_invitations;
create policy team_invitations_select on public.team_invitations for select to authenticated
using (invitee_id = (select auth.uid()) or private.can_manage_team(team_id));

drop policy if exists team_invitations_insert on public.team_invitations;
create policy team_invitations_insert on public.team_invitations for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and invitee_id <> (select auth.uid())
  and private.can_manage_team(team_id)
  and status = 'pending'
);

drop policy if exists team_invitations_update on public.team_invitations;
create policy team_invitations_update on public.team_invitations for update to authenticated
using (invitee_id = (select auth.uid()) or private.can_manage_team(team_id))
with check (invitee_id = (select auth.uid()) or private.can_manage_team(team_id));
