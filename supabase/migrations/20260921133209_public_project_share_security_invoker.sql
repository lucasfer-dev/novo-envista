-- Keep public project sharing available without relying on a SECURITY DEFINER RPC.
-- Anonymous callers receive only explicitly granted public columns, and RLS limits rows
-- to entities intentionally marked as visible on the platform.

create policy "projects_select_platform_anon"
on public.projects for select
to anon
using (visibility = 'platform');

create policy "profiles_select_platform_anon"
on public.profiles for select
to anon
using (profile_visibility = 'platform');

create policy "teams_select_platform_anon"
on public.teams for select
to anon
using (visibility = 'platform');

grant select (
  id, slug, title, short_description, readme, problem, solution, stage, category,
  location, tags, updated_at, repository_url, demo_url, design_url,
  owner_user_id, owner_team_id, visibility
) on public.projects to anon;

grant select (
  id, profile_visibility, display_name, username, headline
) on public.profiles to anon;

grant select (
  id, visibility, name, slug
) on public.teams to anon;

alter function public.get_public_project_share(text) security invoker;
