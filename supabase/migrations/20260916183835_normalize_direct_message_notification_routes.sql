create or replace function private.notify_direct_message()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $function$
declare
  target_user uuid;
  base text;
begin
  select case when c.user_a = new.sender_id then c.user_b else c.user_a end
    into target_user
  from public.direct_conversations c
  where c.id = new.conversation_id;

  if target_user is null then
    return new;
  end if;

  base := private.notification_prefix(target_user);

  insert into public.notifications(user_id, kind, actor_user_id, title, body, href)
  values (
    target_user,
    'message',
    new.sender_id,
    'Nova mensagem',
    left(new.body, 180),
    case
      when base = '/investor' then '/investor/messages/' || new.conversation_id::text
      else '/messages/' || new.conversation_id::text
    end
  );

  return new;
end;
$function$;
