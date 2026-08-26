-- Índices de cobertura para foreign keys apontadas pelo Supabase Performance Advisor.
-- São índices aditivos: não alteram RLS, constraints, dados ou semântica de autorização.

create index if not exists admin_audit_log_admin_user_idx
  on public.admin_audit_log (admin_user_id);

create index if not exists competition_registrations_registered_by_idx
  on public.competition_team_registrations (registered_by);

create index if not exists competitions_created_by_idx
  on public.competitions (created_by);

create index if not exists direct_conversations_created_by_idx
  on public.direct_conversations (created_by);

create index if not exists follows_target_profile_idx
  on public.follows (target_profile_id)
  where target_profile_id is not null;

create index if not exists follows_target_team_idx
  on public.follows (target_team_id)
  where target_team_id is not null;

create index if not exists follows_target_project_idx
  on public.follows (target_project_id)
  where target_project_id is not null;

create index if not exists message_read_state_user_idx
  on public.message_read_state (user_id);

create index if not exists message_reports_message_idx
  on public.message_reports (message_id);

create index if not exists notifications_actor_user_idx
  on public.notifications (actor_user_id)
  where actor_user_id is not null;

create index if not exists posts_created_by_idx
  on public.posts (created_by);

create index if not exists team_invitations_invited_by_idx
  on public.team_invitations (invited_by);
