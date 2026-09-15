create table if not exists public.platform_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  kind text not null default 'event' check (kind in ('event','announcement','competition','deadline')),
  audience text not null default 'all' check (audience in ('all','participant','investor')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  href text not null default '/calendar',
  is_published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_calendar_events_title_len check (char_length(title) between 2 and 160),
  constraint platform_calendar_events_description_len check (char_length(description) <= 3000),
  constraint platform_calendar_events_location_len check (char_length(location) <= 180),
  constraint platform_calendar_events_href_safe check (char_length(href) between 1 and 500 and href like '/%' and href not like '//%'),
  constraint platform_calendar_events_time_order check (ends_at is null or ends_at >= starts_at)
);

create index if not exists platform_calendar_events_upcoming_idx
  on public.platform_calendar_events(is_published, starts_at);

alter table public.platform_calendar_events enable row level security;
revoke all on public.platform_calendar_events from anon, authenticated;
grant select, insert, update, delete on public.platform_calendar_events to authenticated;

drop policy if exists platform_calendar_events_visible_select on public.platform_calendar_events;
create policy platform_calendar_events_visible_select on public.platform_calendar_events
for select to authenticated
using (
  (select private.is_admin())
  or (
    is_published
    and (
      audience = 'all'
      or audience = (select p.role::text from public.profiles p where p.id = (select auth.uid()))
    )
  )
);

drop policy if exists platform_calendar_events_admin_insert on public.platform_calendar_events;
create policy platform_calendar_events_admin_insert on public.platform_calendar_events
for insert to authenticated with check ((select private.is_admin()) and created_by = (select auth.uid()));

drop policy if exists platform_calendar_events_admin_update on public.platform_calendar_events;
create policy platform_calendar_events_admin_update on public.platform_calendar_events
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists platform_calendar_events_admin_delete on public.platform_calendar_events;
create policy platform_calendar_events_admin_delete on public.platform_calendar_events
for delete to authenticated using ((select private.is_admin()));

alter table public.notification_preferences
  add column if not exists calendar_events boolean not null default true;

create table if not exists public.calendar_notification_deliveries (
  event_id uuid not null references public.platform_calendar_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  delivered_at timestamptz not null default now(),
  primary key (event_id, user_id, week_start)
);
alter table public.calendar_notification_deliveries enable row level security;
revoke all on public.calendar_notification_deliveries from anon, authenticated;
grant select on public.calendar_notification_deliveries to authenticated;

drop policy if exists calendar_notification_deliveries_admin_select on public.calendar_notification_deliveries;
create policy calendar_notification_deliveries_admin_select on public.calendar_notification_deliveries
for select to authenticated using ((select private.is_admin()));

create or replace function private.send_weekly_calendar_notifications()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  week_start date := date_trunc('week', (now() at time zone 'America/Sao_Paulo'))::date;
  window_end timestamptz := ((date_trunc('week', (now() at time zone 'America/Sao_Paulo')) + interval '14 days') at time zone 'America/Sao_Paulo');
  window_start timestamptz := ((date_trunc('week', (now() at time zone 'America/Sao_Paulo'))) at time zone 'America/Sao_Paulo');
  row_item record;
  inserted_count integer := 0;
  destination text;
begin
  for row_item in
    select e.id as event_id, e.title, e.description, e.starts_at, e.href, e.audience,
           p.id as user_id, p.role::text as user_role
      from public.platform_calendar_events e
      join public.profiles p
        on e.audience = 'all' or e.audience = p.role::text
      left join public.notification_preferences np on np.user_id = p.id
     where e.is_published = true
       and e.starts_at >= window_start
       and e.starts_at < window_end
       and coalesce(np.calendar_events, true) = true
  loop
    insert into public.calendar_notification_deliveries(event_id, user_id, week_start)
    values(row_item.event_id, row_item.user_id, week_start)
    on conflict do nothing;

    if found then
      destination := case
        when row_item.href = '/calendar' and row_item.user_role = 'investor' then '/investor/calendar'
        else row_item.href
      end;

      insert into public.notifications(user_id, kind, title, body, href)
      values(
        row_item.user_id,
        'calendar_event',
        'Nesta semana no Envista: ' || row_item.title,
        case when btrim(row_item.description) <> '' then left(row_item.description, 680) else 'Há um evento ou aviso importante chegando. Confira os detalhes no calendário.' end,
        destination
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  return inserted_count;
end;
$$;
revoke all on function private.send_weekly_calendar_notifications() from public, anon, authenticated;

create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'envista-weekly-calendar-notifications') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'envista-weekly-calendar-notifications' limit 1));
  end if;
  perform cron.schedule(
    'envista-weekly-calendar-notifications',
    '0 11 * * 1',
    'select private.send_weekly_calendar_notifications();'
  );
end $$;
