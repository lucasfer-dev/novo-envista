-- Minimal first-party activation telemetry for the beta funnel.
-- Intentionally stores no IP address, device fingerprint, free text or page contents.

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  created_at timestamptz not null default now(),
  constraint product_events_name_check check (event_name in (
    'onboarding_completed',
    'project_created',
    'team_created',
    'course_started',
    'course_completed',
    'investor_verification_requested',
    'investor_interest_created',
    'message_started'
  ))
);

create index if not exists product_events_name_created_idx
  on public.product_events(event_name, created_at desc);
create index if not exists product_events_user_created_idx
  on public.product_events(user_id, created_at desc);

alter table public.product_events enable row level security;
revoke all on public.product_events from anon, authenticated;
grant insert, select on public.product_events to authenticated;

drop policy if exists product_events_insert_self on public.product_events;
create policy product_events_insert_self on public.product_events
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists product_events_admin_select on public.product_events;
create policy product_events_admin_select on public.product_events
for select to authenticated
using ((select private.is_admin()));

comment on table public.product_events is
  'Minimal first-party activation telemetry. Stores only user id, allowlisted event name and timestamp; no IP, fingerprint, free-text or page content.';
