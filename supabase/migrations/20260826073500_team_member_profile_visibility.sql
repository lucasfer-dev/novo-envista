-- Permite que membros de uma mesma equipe resolvam o perfil público mínimo uns dos outros,
-- mesmo quando o perfil não está publicado para toda a plataforma.
create or replace function private.shares_team_with(target_user uuid, viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.team_members mine
    join public.team_members theirs on theirs.team_id = mine.team_id
    where mine.user_id = viewer and theirs.user_id = target_user
  );
$$;

revoke all on function private.shares_team_with(uuid, uuid) from public;
grant execute on function private.shares_team_with(uuid, uuid) to authenticated;

drop policy if exists profiles_team_colleagues_select on public.profiles;
create policy profiles_team_colleagues_select on public.profiles
for select to authenticated
using (private.shares_team_with(id));
