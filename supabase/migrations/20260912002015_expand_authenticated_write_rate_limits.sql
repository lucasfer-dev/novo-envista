-- Extend authoritative database abuse limits to authenticated write surfaces
-- that were not covered by the original abuse migration.

drop trigger if exists abuse_limit_project_saves on public.project_saves;
create trigger abuse_limit_project_saves
before insert on public.project_saves
for each row execute function private.enforce_write_rate_limit('project_saves', '120', '600');

drop trigger if exists abuse_limit_project_interests on public.project_interests;
create trigger abuse_limit_project_interests
before insert on public.project_interests
for each row execute function private.enforce_write_rate_limit('project_interests', '30', '86400');

drop trigger if exists abuse_limit_competition_registrations on public.competition_team_registrations;
create trigger abuse_limit_competition_registrations
before insert on public.competition_team_registrations
for each row execute function private.enforce_write_rate_limit('competition_registrations', '20', '86400');

drop trigger if exists abuse_limit_course_enrollments on public.course_enrollments;
create trigger abuse_limit_course_enrollments
before insert on public.course_enrollments
for each row execute function private.enforce_write_rate_limit('course_enrollments', '30', '86400');

drop trigger if exists abuse_limit_user_blocks on public.user_blocks;
create trigger abuse_limit_user_blocks
before insert on public.user_blocks
for each row execute function private.enforce_write_rate_limit('user_blocks', '30', '3600');
