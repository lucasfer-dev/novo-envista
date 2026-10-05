-- GitHub App integration for Envista.
-- Stores only GitHub App installation identifiers and public repository metadata.
-- No long-lived GitHub access tokens are persisted.

create table if not exists public.github_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  installation_id bigint not null unique,
  github_account_id bigint not null,
  github_login text not null,
  github_avatar_url text,
  github_html_url text not null,
  github_account_type text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.github_repositories (
  user_id uuid not null references public.github_connections(user_id) on delete cascade,
  github_repo_id bigint not null,
  name text not null,
  full_name text not null,
  owner_login text not null,
  description text,
  html_url text not null,
  homepage text,
  private boolean not null default false,
  language text,
  stargazers_count integer not null default 0,
  forks_count integer not null default 0,
  open_issues_count integer not null default 0,
  default_branch text not null default 'main',
  topics text[] not null default '{}',
  display_on_profile boolean not null default false,
  github_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (user_id, github_repo_id)
);

create table if not exists public.github_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.github_connections(user_id) on delete cascade,
  github_delivery_id text unique,
  event_type text not null,
  event_action text,
  title text not null,
  summary text,
  repository_full_name text,
  repository_html_url text,
  event_html_url text,
  is_public boolean not null default false,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);


create index if not exists github_repositories_profile_idx
  on public.github_repositories (user_id, display_on_profile, private);

create index if not exists github_events_user_occurred_idx
  on public.github_events (user_id, occurred_at desc);

alter table public.github_connections enable row level security;
alter table public.github_repositories enable row level security;
alter table public.github_events enable row level security;

drop policy if exists github_connections_owner_select on public.github_connections;
create policy github_connections_owner_select
  on public.github_connections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists github_connections_owner_insert on public.github_connections;
create policy github_connections_owner_insert
  on public.github_connections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists github_connections_owner_update on public.github_connections;
create policy github_connections_owner_update
  on public.github_connections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists github_connections_owner_delete on public.github_connections;
create policy github_connections_owner_delete
  on public.github_connections
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists github_repositories_owner_or_public_select on public.github_repositories;
create policy github_repositories_owner_or_public_select
  on public.github_repositories
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      display_on_profile = true
      and private = false
      and exists (
        select 1
        from public.profiles profile
        where profile.id = github_repositories.user_id
          and profile.profile_visibility = 'platform'
      )
    )
  );

drop policy if exists github_repositories_owner_insert on public.github_repositories;
create policy github_repositories_owner_insert
  on public.github_repositories
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists github_repositories_owner_update on public.github_repositories;
create policy github_repositories_owner_update
  on public.github_repositories
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists github_repositories_owner_delete on public.github_repositories;
create policy github_repositories_owner_delete
  on public.github_repositories
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists github_events_owner_or_public_select on public.github_events;
create policy github_events_owner_or_public_select
  on public.github_events
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      is_public = true
      and exists (
        select 1
        from public.profiles profile
        where profile.id = github_events.user_id
          and profile.profile_visibility = 'platform'
      )
    )
  );

drop policy if exists github_events_owner_insert on public.github_events;
create policy github_events_owner_insert
  on public.github_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists github_events_owner_update on public.github_events;
create policy github_events_owner_update
  on public.github_events
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists github_events_owner_delete on public.github_events;
create policy github_events_owner_delete
  on public.github_events
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.github_connections to authenticated;
grant select, insert, update, delete on public.github_repositories to authenticated;
grant select, insert, update, delete on public.github_events to authenticated;
