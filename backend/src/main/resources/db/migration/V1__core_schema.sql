create extension if not exists citext;
create table if not exists profiles (
 id uuid primary key,
 username citext not null unique,
 name varchar(120) not null,
 role varchar(30) not null check (role in ('PARTICIPANT','INVESTOR','ADMIN')),
 city varchar(120), state varchar(60), bio text, organization_type varchar(50), organization_name varchar(160), job_title varchar(120),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists teams (
 id uuid primary key, slug citext not null unique, name varchar(120) not null, description text, category varchar(80), city varchar(120), institution varchar(160), created_by uuid not null references profiles(id), created_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists team_members (
 id uuid primary key, team_id uuid not null references teams(id), user_id uuid not null references profiles(id), role varchar(80) not null, permission_level varchar(20) not null default 'MEMBER', joined_at timestamptz not null default now(), unique(team_id,user_id)
);
create table if not exists projects (
 id uuid primary key, slug citext not null unique, title varchar(120) not null, short_description varchar(300), problem text, solution text, stage varchar(30) not null, category varchar(80), location varchar(160), author_type varchar(10) not null check (author_type in ('USER','TEAM')), author_user_id uuid references profiles(id), author_team_id uuid references teams(id), created_by uuid not null references profiles(id), status varchar(20) not null default 'PUBLISHED', visibility varchar(20) not null default 'PUBLIC', likes_count bigint not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
 check ((author_type='USER' and author_user_id is not null and author_team_id is null) or (author_type='TEAM' and author_team_id is not null and author_user_id is null))
);
create table if not exists project_likes (user_id uuid references profiles(id), project_id uuid references projects(id), created_at timestamptz not null default now(), primary key(user_id,project_id));
create table if not exists project_follows (user_id uuid references profiles(id), project_id uuid references projects(id), created_at timestamptz not null default now(), primary key(user_id,project_id));
create table if not exists social_posts (
 id uuid primary key, author_user_id uuid references profiles(id), author_team_id uuid references teams(id), body text not null check (char_length(body) between 1 and 5000), image_url text, created_at timestamptz not null default now(), deleted_at timestamptz,
 check ((author_user_id is not null and author_team_id is null) or (author_team_id is not null and author_user_id is null))
);
create table if not exists user_follows (follower_id uuid references profiles(id), followed_id uuid references profiles(id), created_at timestamptz not null default now(), primary key(follower_id,followed_id), check (follower_id<>followed_id));
create index if not exists idx_projects_created_at on projects(created_at desc);
create index if not exists idx_team_members_user on team_members(user_id);
create index if not exists idx_social_posts_created_at on social_posts(created_at desc);
