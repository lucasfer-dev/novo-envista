create index if not exists platform_calendar_events_created_by_idx on public.platform_calendar_events(created_by);
create index if not exists calendar_notification_deliveries_user_idx on public.calendar_notification_deliveries(user_id);
