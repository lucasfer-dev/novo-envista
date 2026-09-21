create table if not exists public.privacy_contact_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  request_type text not null check (request_type in ('access','correction','deletion','portability','sharing','minor','other')),
  message text not null default '' check (char_length(message) <= 2000),
  status text not null default 'open' check (status in ('open','in_progress','resolved','rejected')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.privacy_contact_requests enable row level security;

revoke all on public.privacy_contact_requests from anon, authenticated;
grant insert on public.privacy_contact_requests to anon, authenticated;
grant select, update on public.privacy_contact_requests to authenticated;

create policy "privacy_contact_public_insert"
on public.privacy_contact_requests
for insert
to anon, authenticated
with check (
  status = 'open'
  and admin_note = ''
  and resolved_at is null
);

create policy "privacy_contact_admin_select"
on public.privacy_contact_requests
for select
to authenticated
using ((select private.is_admin()));

create policy "privacy_contact_admin_update"
on public.privacy_contact_requests
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create index if not exists privacy_contact_requests_status_created_idx
on public.privacy_contact_requests(status, created_at desc);
