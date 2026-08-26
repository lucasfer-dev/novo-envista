-- Competições gerenciadas exclusivamente pelo painel administrativo.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  organizer text not null default 'Envista',
  location text not null default '',
  format text not null default '',
  status text not null default 'draft',
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  max_teams integer,
  rules text not null default '',
  prize text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint competitions_title_length check (char_length(title) between 3 and 160),
  constraint competitions_summary_length check (char_length(summary) <= 500),
  constraint competitions_description_length check (char_length(description) <= 12000),
  constraint competitions_organizer_length check (char_length(organizer) between 1 and 160),
  constraint competitions_location_length check (char_length(location) <= 220),
  constraint competitions_format_length check (char_length(format) <= 120),
  constraint competitions_status check (status in ('draft','published','closed','archived')),
  constraint competitions_max_teams check (max_teams is null or max_teams between 1 and 10000),
  constraint competitions_rules_length check (char_length(rules) <= 20000),
  constraint competitions_prize_length check (char_length(prize) <= 3000),
  constraint competitions_registration_dates check (
    registration_opens_at is null or registration_closes_at is null or registration_closes_at >= registration_opens_at
  ),
  constraint competitions_event_dates check (
    starts_at is null or ends_at is null or ends_at >= starts_at
  )
);

create index if not exists competitions_status_dates_idx on public.competitions(status, starts_at);
create index if not exists competitions_created_at_idx on public.competitions(created_at desc);

create table if not exists public.competition_team_registrations (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  registered_by uuid references auth.users(id) on delete set null,
  note text not null default '',
  registered_at timestamptz not null default now(),
  primary key (competition_id, team_id),
  constraint competition_registration_note_length check (char_length(note) <= 1000)
);

create index if not exists competition_registrations_team_idx on public.competition_team_registrations(team_id, registered_at desc);
create index if not exists competition_registrations_competition_idx on public.competition_team_registrations(competition_id, registered_at desc);

create or replace function private.touch_competition_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.created_by = old.created_by;
  return new;
end;
$$;

drop trigger if exists competitions_touch_updated_at on public.competitions;
create trigger competitions_touch_updated_at
before update on public.competitions
for each row execute function private.touch_competition_updated_at();

create or replace function private.enforce_competition_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  capacity integer;
  current_count integer;
begin
  select c.max_teams into capacity
  from public.competitions c
  where c.id = new.competition_id;

  if capacity is not null then
    select count(*)::integer into current_count
    from public.competition_team_registrations r
    where r.competition_id = new.competition_id
      and (tg_op <> 'UPDATE' or r.team_id <> old.team_id);

    if current_count >= capacity then
      raise exception 'competition capacity reached';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists competition_capacity_guard on public.competition_team_registrations;
create trigger competition_capacity_guard
before insert or update on public.competition_team_registrations
for each row execute function private.enforce_competition_capacity();

alter table public.competitions enable row level security;
alter table public.competition_team_registrations enable row level security;

revoke all on public.competitions from anon, authenticated;
revoke all on public.competition_team_registrations from anon, authenticated;
grant select, insert, update, delete on public.competitions to authenticated;
grant select, insert, update, delete on public.competition_team_registrations to authenticated;

drop policy if exists competitions_select_platform_or_admin on public.competitions;
create policy competitions_select_platform_or_admin
on public.competitions for select to authenticated
using (status in ('published','closed') or private.is_admin());

drop policy if exists competitions_insert_admin on public.competitions;
create policy competitions_insert_admin
on public.competitions for insert to authenticated
with check (private.is_admin() and created_by = (select auth.uid()));

drop policy if exists competitions_update_admin on public.competitions;
create policy competitions_update_admin
on public.competitions for update to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists competitions_delete_admin on public.competitions;
create policy competitions_delete_admin
on public.competitions for delete to authenticated
using (private.is_admin());

drop policy if exists competition_registrations_select_platform_or_admin on public.competition_team_registrations;
create policy competition_registrations_select_platform_or_admin
on public.competition_team_registrations for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.competitions c
    where c.id = competition_id and c.status in ('published','closed')
  )
);

drop policy if exists competition_registrations_insert_admin on public.competition_team_registrations;
create policy competition_registrations_insert_admin
on public.competition_team_registrations for insert to authenticated
with check (private.is_admin() and registered_by = (select auth.uid()));

drop policy if exists competition_registrations_update_admin on public.competition_team_registrations;
create policy competition_registrations_update_admin
on public.competition_team_registrations for update to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists competition_registrations_delete_admin on public.competition_team_registrations;
create policy competition_registrations_delete_admin
on public.competition_team_registrations for delete to authenticated
using (private.is_admin());

-- O painel pode consultar os membros para inspeção das equipes,
-- sem ganhar permissão de alterar membership por esta tela.
grant select on public.team_members to authenticated;
drop policy if exists team_members_select_admin on public.team_members;
create policy team_members_select_admin
on public.team_members for select to authenticated
using (private.is_admin());
