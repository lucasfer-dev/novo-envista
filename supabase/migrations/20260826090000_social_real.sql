-- Social real: follows, posts, likes e comentários.
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  target_profile_id uuid references public.profiles(id) on delete cascade,
  target_team_id uuid references public.teams(id) on delete cascade,
  target_project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (((target_profile_id is not null)::int + (target_team_id is not null)::int + (target_project_id is not null)::int) = 1),
  check (target_profile_id is null or target_profile_id <> follower_id)
);
create unique index if not exists follows_profile_unique on public.follows(follower_id,target_profile_id) where target_profile_id is not null;
create unique index if not exists follows_team_unique on public.follows(follower_id,target_team_id) where target_team_id is not null;
create unique index if not exists follows_project_unique on public.follows(follower_id,target_project_id) where target_project_id is not null;
create index if not exists follows_follower_idx on public.follows(follower_id,created_at desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references public.profiles(id) on delete cascade,
  author_team_id uuid references public.teams(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 5000),
  visibility text not null default 'platform' check (visibility in ('private','platform')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (((author_user_id is not null)::int + (author_team_id is not null)::int) = 1)
);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_author_user_idx on public.posts(author_user_id,created_at desc);
create index if not exists posts_author_team_idx on public.posts(author_team_id,created_at desc);
create index if not exists posts_project_idx on public.posts(project_id,created_at desc);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create index if not exists post_likes_user_idx on public.post_likes(user_id,created_at desc);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments(post_id,created_at asc);
create index if not exists post_comments_user_idx on public.post_comments(user_id);

create or replace function private.can_view_post(target_post uuid, viewer uuid default auth.uid())
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.posts p where p.id=target_post and (p.visibility='platform' or p.author_user_id=viewer or (p.author_team_id is not null and private.is_team_member(p.author_team_id,viewer))));
$$;
create or replace function private.can_edit_post(target_post uuid, viewer uuid default auth.uid())
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.posts p where p.id=target_post and (p.author_user_id=viewer or p.created_by=viewer or (p.author_team_id is not null and private.can_manage_team(p.author_team_id,viewer))));
$$;
revoke all on function private.can_view_post(uuid,uuid) from public;
revoke all on function private.can_edit_post(uuid,uuid) from public;
grant execute on function private.can_view_post(uuid,uuid) to authenticated;
grant execute on function private.can_edit_post(uuid,uuid) to authenticated;

create or replace function private.post_protect_ownership()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if new.author_user_id is distinct from old.author_user_id or new.author_team_id is distinct from old.author_team_id or new.created_by is distinct from old.created_by then raise exception 'post ownership is immutable'; end if;
 new.updated_at:=now(); return new;
end; $$;
drop trigger if exists posts_protect_ownership on public.posts;
create trigger posts_protect_ownership before update on public.posts for each row execute function private.post_protect_ownership();

create or replace function private.comment_protect_identity()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if new.post_id<>old.post_id or new.user_id<>old.user_id then raise exception 'comment identity is immutable'; end if;
 new.updated_at:=now(); return new;
end; $$;
drop trigger if exists comments_protect_identity on public.post_comments;
create trigger comments_protect_identity before update on public.post_comments for each row execute function private.comment_protect_identity();

alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
revoke all on public.follows,public.posts,public.post_likes,public.post_comments from anon;
revoke all on public.follows,public.posts,public.post_likes,public.post_comments from authenticated;
grant select,insert,delete on public.follows to authenticated;
grant select,insert,update,delete on public.posts to authenticated;
grant select,insert,delete on public.post_likes to authenticated;
grant select,insert,update,delete on public.post_comments to authenticated;

drop policy if exists follows_select_self on public.follows;
create policy follows_select_self on public.follows for select to authenticated using(follower_id=(select auth.uid()));
drop policy if exists follows_insert_self on public.follows;
create policy follows_insert_self on public.follows for insert to authenticated with check(
 follower_id=(select auth.uid()) and (
   (target_profile_id is not null and target_profile_id<>(select auth.uid()) and exists(select 1 from public.profiles p where p.id=target_profile_id and p.profile_visibility='platform'))
   or (target_team_id is not null and exists(select 1 from public.teams t where t.id=target_team_id and t.visibility='platform'))
   or (target_project_id is not null and exists(select 1 from public.projects p where p.id=target_project_id and p.visibility='platform'))
 )
);
drop policy if exists follows_delete_self on public.follows;
create policy follows_delete_self on public.follows for delete to authenticated using(follower_id=(select auth.uid()));

drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select to authenticated using(private.can_view_post(id));
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated with check(
 created_by=(select auth.uid()) and (
   author_user_id=(select auth.uid())
   or (author_team_id is not null and private.is_team_member(author_team_id))
 )
);
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated using(private.can_edit_post(id)) with check(private.can_edit_post(id));
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete to authenticated using(private.can_edit_post(id));

drop policy if exists post_likes_select on public.post_likes;
create policy post_likes_select on public.post_likes for select to authenticated using(private.can_view_post(post_id));
drop policy if exists post_likes_insert on public.post_likes;
create policy post_likes_insert on public.post_likes for insert to authenticated with check(user_id=(select auth.uid()) and private.can_view_post(post_id));
drop policy if exists post_likes_delete on public.post_likes;
create policy post_likes_delete on public.post_likes for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists post_comments_select on public.post_comments;
create policy post_comments_select on public.post_comments for select to authenticated using(private.can_view_post(post_id));
drop policy if exists post_comments_insert on public.post_comments;
create policy post_comments_insert on public.post_comments for insert to authenticated with check(user_id=(select auth.uid()) and private.can_view_post(post_id));
drop policy if exists post_comments_update on public.post_comments;
create policy post_comments_update on public.post_comments for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists post_comments_delete on public.post_comments;
create policy post_comments_delete on public.post_comments for delete to authenticated using(user_id=(select auth.uid()));
