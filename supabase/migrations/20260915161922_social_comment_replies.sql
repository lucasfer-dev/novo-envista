alter table public.post_comments add column if not exists parent_comment_id uuid references public.post_comments(id) on delete cascade;
create index if not exists post_comments_parent_idx on public.post_comments(parent_comment_id, created_at asc) where parent_comment_id is not null;

create or replace function private.notify_comment()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare target_user uuid; base text;
begin
  if new.parent_comment_id is not null then
    select user_id into target_user from public.post_comments where id=new.parent_comment_id and post_id=new.post_id;
  else
    select created_by into target_user from public.posts where id=new.post_id;
  end if;
  if target_user is null or target_user=new.user_id then return new; end if;
  base:=private.notification_prefix(target_user);
  insert into public.notifications(user_id,kind,actor_user_id,title,body,href)
  values(target_user,case when new.parent_comment_id is null then 'comment' else 'comment_reply' end,new.user_id,case when new.parent_comment_id is null then 'Novo comentário' else 'Nova resposta ao seu comentário' end,left(new.body,180),coalesce(base,'/app')||'/social');
  return new;
end;$$;
revoke all on function private.notify_comment() from public, anon, authenticated;
