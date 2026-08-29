-- Hardening: team membership must only be created by trusted database flows.
--
-- The existing invitation transition trigger is SECURITY DEFINER and inserts the
-- accepted invitee into the exact invited team. Team creation also provisions
-- the owner membership through a SECURITY DEFINER trigger.
--
-- Authenticated clients therefore do not need direct INSERT access to
-- public.team_members. Removing it closes a path where a client could attempt
-- to manufacture membership rows outside those trusted flows.

revoke insert on public.team_members from authenticated;
revoke insert on public.team_members from anon;

drop policy if exists team_members_insert on public.team_members;
