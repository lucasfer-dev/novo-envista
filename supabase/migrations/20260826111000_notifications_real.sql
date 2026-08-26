create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null default '',
  href text not null default '/',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_kind_length check (char_length(kind) between 2 and 50),
  constraint notifications_title_length check (char_length(title) between 1 and 160),
  constraint notifications_body_length check (char_length(body) <= 700),
  constraint notifications_href_safe check (char_length(href) between 1 and 500 and href like '/%')
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy notifications_select_own on public.notifications for select to authenticated
using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_delete_own on public.notifications for delete to authenticated
using (user_id = (select auth.uid()));

create or replace function private.notification_prefix(target_user uuid)
returns text language sql stable security definer set search_path=pg_catalog,public as $$
  select case when p.role='investor' then '/investor' else '/app' end from public.profiles p where p.id=target_user;
$$;
revoke all on function private.notification_prefix(uuid) from public, anon, authenticated;

create or replace function private.notify_team_invitation()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare team_name text; base text;
begin
  select name into team_name from public.teams where id=new.team_id;
  base:=private.notification_prefix(new.invitee_id);
  insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
  values(new.invitee_id,'team_invite',new.invited_by,'Convite para equipe',coalesce(team_name,'Uma equipe')||' convidou você para participar.',coalesce(base,'/app')||'/teams');
  return new;
end;$$;
revoke all on function private.notify_team_invitation() from public, anon, authenticated;
drop trigger if exists notifications_team_invitation on public.team_invitations;
create trigger notifications_team_invitation after insert on public.team_invitations for each row execute function private.notify_team_invitation();

create or replace function private.notify_follow()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare target_user uuid; entity_name text; entity_href text; base text;
begin
  if new.target_profile_id is not null then
    target_user:=new.target_profile_id; entity_name:='seu perfil';
  elsif new.target_team_id is not null then
    select owner_id,name,slug into target_user,entity_name,entity_href from public.teams where id=new.target_team_id;
  elsif new.target_project_id is not null then
    select coalesce(p.owner_user_id,t.owner_id),p.title,p.slug into target_user,entity_name,entity_href
    from public.projects p left join public.teams t on t.id=p.owner_team_id where p.id=new.target_project_id;
  end if;
  if target_user is null or target_user=new.follower_id then return new; end if;
  base:=private.notification_prefix(target_user);
  insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
  values(target_user,'follow',new.follower_id,'Novo seguidor','Uma pessoa começou a seguir '||coalesce(entity_name,'seu conteúdo')||'.',
    case when new.target_profile_id is not null then coalesce(base,'/app')||'/social'
         when new.target_team_id is not null then coalesce(base,'/app')||'/teams/'||entity_href
         else coalesce(base,'/app')||'/projects/'||entity_href end);
  return new;
end;$$;
revoke all on function private.notify_follow() from public, anon, authenticated;
drop trigger if exists notifications_follow on public.follows;
create trigger notifications_follow after insert on public.follows for each row execute function private.notify_follow();

create or replace function private.notify_comment()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare target_user uuid; base text;
begin
  select created_by into target_user from public.posts where id=new.post_id;
  if target_user is null or target_user=new.user_id then return new; end if;
  base:=private.notification_prefix(target_user);
  insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
  values(target_user,'comment',new.user_id,'Novo comentário',left(new.body,180),coalesce(base,'/app')||'/social');
  return new;
end;$$;
revoke all on function private.notify_comment() from public, anon, authenticated;
drop trigger if exists notifications_comment on public.post_comments;
create trigger notifications_comment after insert on public.post_comments for each row execute function private.notify_comment();

create or replace function private.notify_direct_message()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare target_user uuid; base text;
begin
  select case when c.user_a=new.sender_id then c.user_b else c.user_a end into target_user
  from public.direct_conversations c where c.id=new.conversation_id;
  if target_user is null then return new; end if;
  base:=private.notification_prefix(target_user);
  insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
  values(target_user,'message',new.sender_id,'Nova mensagem',left(new.body,180),coalesce(base,'/app')||'/messages/'||new.conversation_id::text);
  return new;
end;$$;
revoke all on function private.notify_direct_message() from public, anon, authenticated;
drop trigger if exists notifications_direct_message on public.direct_messages;
create trigger notifications_direct_message after insert on public.direct_messages for each row execute function private.notify_direct_message();

create or replace function private.notify_project_followers()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare follower record; base text; actor uuid:=auth.uid();
begin
  if new.updated_at is not distinct from old.updated_at then return new; end if;
  for follower in select f.follower_id from public.follows f where f.target_project_id=new.id and f.follower_id is distinct from actor loop
    base:=private.notification_prefix(follower.follower_id);
    insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
    values(follower.follower_id,'project_update',actor,'Projeto atualizado',new.title||' recebeu uma atualização.',coalesce(base,'/app')||'/projects/'||new.slug);
  end loop;
  return new;
end;$$;
revoke all on function private.notify_project_followers() from public, anon, authenticated;
drop trigger if exists notifications_project_update on public.projects;
create trigger notifications_project_update after update on public.projects for each row execute function private.notify_project_followers();

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end$$;
