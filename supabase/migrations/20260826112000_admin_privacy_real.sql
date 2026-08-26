-- Administração real sem role confiada ao cliente e central de direitos do titular.

-- O usuário autenticado pode descobrir SOMENTE se a própria conta possui membership admin.
grant select (user_id, created_at) on public.admin_memberships to authenticated;
drop policy if exists admin_memberships_select_self on public.admin_memberships;
create policy admin_memberships_select_self
on public.admin_memberships for select to authenticated
using (user_id = (select auth.uid()));

-- Políticas administrativas usam a existência da própria membership. Não existe grant
-- para inserir/alterar admin_memberships pelo cliente, portanto não há autopromoção.
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles for select to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

drop policy if exists account_compliance_select_admin on public.account_compliance;
create policy account_compliance_select_admin on public.account_compliance for select to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

drop policy if exists teams_select_admin on public.teams;
create policy teams_select_admin on public.teams for select to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

drop policy if exists projects_select_admin on public.projects;
create policy projects_select_admin on public.projects for select to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

drop policy if exists posts_select_admin on public.posts;
create policy posts_select_admin on public.posts for select to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

-- Conteúdo educacional: grants existem para authenticated, mas RLS só autoriza escrita admin.
grant insert, update, delete on public.courses, public.course_modules, public.course_lessons to authenticated;

drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses for all to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

drop policy if exists course_modules_admin_all on public.course_modules;
create policy course_modules_admin_all on public.course_modules for all to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

drop policy if exists course_lessons_admin_all on public.course_lessons;
create policy course_lessons_admin_all on public.course_lessons for all to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

-- Moderação de denúncias: reporter continua vendo apenas as próprias; admins podem revisar.
alter table public.message_reports add column if not exists admin_note text not null default '';
alter table public.message_reports add column if not exists resolved_at timestamptz;
alter table public.message_reports drop constraint if exists message_reports_admin_note_length;
alter table public.message_reports add constraint message_reports_admin_note_length check (char_length(admin_note) <= 2000);
grant update (status, admin_note, resolved_at) on public.message_reports to authenticated;

drop policy if exists message_reports_select_admin on public.message_reports;
create policy message_reports_select_admin on public.message_reports for select to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

drop policy if exists message_reports_update_admin on public.message_reports;
create policy message_reports_update_admin on public.message_reports for update to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

-- Solicitações de privacidade / direitos do titular.
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null,
  details text not null default '',
  status text not null default 'open',
  admin_note text not null default '',
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint privacy_requests_type check (request_type in ('access','correction','deletion','export','other')),
  constraint privacy_requests_details_length check (char_length(details) <= 2000),
  constraint privacy_requests_status check (status in ('open','in_review','completed','rejected')),
  constraint privacy_requests_admin_note_length check (char_length(admin_note) <= 2000)
);
create index if not exists privacy_requests_user_idx on public.privacy_requests(user_id, requested_at desc);
create index if not exists privacy_requests_status_idx on public.privacy_requests(status, requested_at asc);
alter table public.privacy_requests enable row level security;
revoke all on public.privacy_requests from anon, authenticated;
grant select, insert on public.privacy_requests to authenticated;
grant update (status, admin_note, resolved_at) on public.privacy_requests to authenticated;

create policy privacy_requests_select_own_or_admin
on public.privacy_requests for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid()))
);

create policy privacy_requests_insert_own
on public.privacy_requests for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'open' and admin_note = '' and resolved_at is null);

create policy privacy_requests_update_admin
on public.privacy_requests for update to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

-- Log administrativo append-only. Não contém conteúdo sensível por padrão: apenas ação,
-- alvo técnico e metadados curtos.
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null default '',
  target_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_action_length check (char_length(action) between 2 and 100),
  constraint admin_audit_target_type_length check (char_length(target_type) <= 80),
  constraint admin_audit_target_id_length check (char_length(target_id) <= 200),
  constraint admin_audit_metadata_size check (octet_length(metadata::text) <= 8000)
);
create index if not exists admin_audit_created_idx on public.admin_audit_log(created_at desc);
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;
grant select, insert on public.admin_audit_log to authenticated;

create policy admin_audit_select_admin
on public.admin_audit_log for select to authenticated
using (exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid())));

create policy admin_audit_insert_admin_self
on public.admin_audit_log for insert to authenticated
with check (
  admin_user_id = (select auth.uid())
  and exists (select 1 from public.admin_memberships a where a.user_id = (select auth.uid()))
);
