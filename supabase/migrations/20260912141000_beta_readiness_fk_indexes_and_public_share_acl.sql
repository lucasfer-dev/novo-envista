-- Beta readiness hardening: cover foreign keys introduced by the professional product suite
-- and make the intentional public-share RPC grants explicit.

create index if not exists project_milestones_created_by_idx
  on public.project_milestones(created_by);

create index if not exists project_updates_author_id_idx
  on public.project_updates(author_id);

create index if not exists team_tasks_assignee_id_idx
  on public.team_tasks(assignee_id);

create index if not exists team_tasks_created_by_idx
  on public.team_tasks(created_by);

-- Public project sharing intentionally uses SECURITY DEFINER so anonymous visitors can
-- read an allowlisted projection without granting anon direct SELECT on projects/profiles/teams.
revoke all on function public.get_public_project_share(text) from PUBLIC;
grant execute on function public.get_public_project_share(text) to anon, authenticated;

comment on function public.get_public_project_share(text) is
  'Intentional public-share RPC. SECURITY DEFINER is required because base project/profile/team rows are not directly exposed to anon. Output is explicitly allowlisted and limited to projects with visibility=platform.';
