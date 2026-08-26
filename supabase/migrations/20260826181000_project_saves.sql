create table if not exists public.project_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create index if not exists project_saves_user_created_idx on public.project_saves(user_id, created_at desc);

alter table public.project_saves enable row level security;
revoke all on public.project_saves from anon, authenticated;
grant select, insert, delete on public.project_saves to authenticated;

create policy project_saves_select_self on public.project_saves
for select to authenticated
using (user_id = (select auth.uid()));

create policy project_saves_insert_self on public.project_saves
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'investor'
  )
  and exists (
    select 1 from public.projects pr
    where pr.id = project_id and pr.visibility = 'platform'
  )
);

create policy project_saves_delete_self on public.project_saves
for delete to authenticated
using (user_id = (select auth.uid()));
