create or replace function private.notify_project_interest_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.projects%rowtype;
begin
  select * into p from public.projects where id = new.project_id;

  if p.owner_user_id is not null and p.owner_user_id <> new.investor_id then
    insert into public.notifications (user_id, kind, actor_user_id, title, body, href)
    values (p.owner_user_id, 'project_interest_new', new.investor_id, 'Novo interesse no seu projeto', p.title, '/app/interests');
  elsif p.owner_team_id is not null then
    insert into public.notifications (user_id, kind, actor_user_id, title, body, href)
    select distinct tm.user_id, 'project_interest_new', new.investor_id,
      'Novo interesse em um projeto da sua equipe', p.title, '/app/interests'
    from public.team_members tm
    where tm.team_id = p.owner_team_id
      and tm.access_level in ('owner', 'admin')
      and tm.user_id <> new.investor_id;
  end if;
  return new;
end;
$$;

revoke all on function private.notify_project_interest_insert() from public;
drop trigger if exists project_interests_notify_insert on public.project_interests;
create trigger project_interests_notify_insert
after insert on public.project_interests
for each row execute function private.notify_project_interest_insert();

create or replace function private.notify_project_interest_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_title text;
  status_label text;
begin
  if new.owner_status is not distinct from old.owner_status then
    return new;
  end if;

  select title into p_title from public.projects where id = new.project_id;
  status_label := case new.owner_status
    when 'viewed' then 'Seu interesse foi visualizado.'
    when 'contacted' then 'O projeto marcou o contato como iniciado.'
    when 'meeting' then 'O projeto marcou uma reunião/conversa em andamento.'
    when 'closed' then 'O acompanhamento deste interesse foi encerrado.'
    else 'Seu interesse recebeu uma atualização.'
  end;

  insert into public.notifications (user_id, kind, actor_user_id, title, body, href)
  values (
    new.investor_id,
    'project_interest_status',
    (select auth.uid()),
    'Atualização de interesse',
    coalesce(p_title, 'Projeto') || ' — ' || status_label,
    '/investor/interests'
  );
  return new;
end;
$$;

revoke all on function private.notify_project_interest_status() from public;
drop trigger if exists project_interests_notify_status on public.project_interests;
create trigger project_interests_notify_status
after update of owner_status on public.project_interests
for each row execute function private.notify_project_interest_status();
