-- Product role boundaries:
-- participants create/manage teams and projects;
-- investors discover, follow, save, show interest and message.

create or replace function private.is_participant(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user
      and p.role = 'participant'
  );
$$;

revoke all on function private.is_participant(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_participant(uuid) to authenticated;

-- Only participants can create or mutate teams they manage.
drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert to authenticated
with check (
  private.is_participant()
  and owner_id = (select auth.uid())
);

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
using (
  private.is_participant()
  and private.can_manage_team(id)
)
with check (
  private.is_participant()
  and private.can_manage_team(id)
);

drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated
using (
  private.is_participant()
  and owner_id = (select auth.uid())
);

-- Team invitations are participant-to-participant collaboration only.
drop policy if exists team_invitations_insert on public.team_invitations;
create policy team_invitations_insert on public.team_invitations for insert to authenticated
with check (
  private.is_participant()
  and invited_by = (select auth.uid())
  and invitee_id <> (select auth.uid())
  and private.can_manage_team(team_id)
  and status = 'pending'
  and private.is_participant(invitee_id)
);

-- Only participants can create or mutate owned projects.
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated
with check (
  private.is_participant()
  and created_by = (select auth.uid())
  and (
    owner_user_id = (select auth.uid())
    or (owner_team_id is not null and private.is_team_member(owner_team_id))
  )
);

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated
using (
  private.is_participant()
  and private.can_edit_project(id)
)
with check (
  private.is_participant()
  and private.can_edit_project(id)
);

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated
using (
  private.is_participant()
  and private.can_delete_project(id)
);
