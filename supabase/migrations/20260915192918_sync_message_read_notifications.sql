create or replace function private.sync_message_notifications_on_read()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  update public.notifications
  set read_at = coalesce(read_at, new.last_read_at)
  where user_id = new.user_id
    and kind = 'message'
    and read_at is null
    and href in (
      '/messages/' || new.conversation_id::text,
      '/app/messages/' || new.conversation_id::text,
      '/investor/messages/' || new.conversation_id::text
    );
  return new;
end;
$$;

drop trigger if exists sync_message_notifications_on_read on public.message_read_state;
create trigger sync_message_notifications_on_read
after insert or update of last_read_at on public.message_read_state
for each row execute function private.sync_message_notifications_on_read();
