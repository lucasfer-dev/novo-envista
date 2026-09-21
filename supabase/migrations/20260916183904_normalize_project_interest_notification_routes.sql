create or replace function private.notify_project_interest()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $function$
declare
  target_user uuid;
  project_title text;
  project_slug text;
begin
  select coalesce(p.owner_user_id, t.owner_id), p.title, p.slug
    into target_user, project_title, project_slug
  from public.projects p
  left join public.teams t on t.id = p.owner_team_id
  where p.id = new.project_id;

  if target_user is null or target_user = new.investor_id then
    return new;
  end if;

  insert into public.notifications(user_id, kind, actor_user_id, title, body, href)
  values (
    target_user,
    'project_interest',
    new.investor_id,
    'Novo interesse no projeto',
    'Um investidor demonstrou interesse em ' || coalesce(project_title, 'seu projeto') || '.',
    '/interests'
  );
  return new;
end;
$function$;

create or replace function private.notify_project_interest_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  p public.projects%rowtype;
begin
  select * into p from public.projects where id = new.project_id;
  if p.owner_user_id is not null and p.owner_user_id <> new.investor_id then
    insert into public.notifications (user_id, kind, actor_user_id, title, body, href)
    values (p.owner_user_id, 'project_interest_new', new.investor_id, 'Novo interesse no seu projeto', p.title, '/interests');
  elsif p.owner_team_id is not null then
    insert into public.notifications (user_id, kind, actor_user_id, title, body, href)
    select distinct tm.user_id, 'project_interest_new', new.investor_id, 'Novo interesse em um projeto da sua equipe', p.title, '/interests'
    from public.team_members tm
    where tm.team_id = p.owner_team_id
      and tm.access_level in ('owner','admin')
      and tm.user_id <> new.investor_id;
  end if;
  return new;
end;
$function$;
