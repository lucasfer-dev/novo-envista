-- 2026-11-05: fix reported professional-profile and course publishing failures.
-- RLS remains the authorization boundary for profile updates.
grant update (headline, skills, github_url, linkedin_url, website_url)
  on table public.profiles to authenticated;

-- A lesson is ready only if it contains educational content or an actual asset.
create or replace function private.course_lesson_is_ready(p_lesson_id uuid)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from public.course_lessons l
    where l.id = p_lesson_id
      and (
        pg_catalog.length(pg_catalog.btrim(l.content_md)) >= 80
        or exists(select 1 from public.course_lesson_assets a where a.lesson_id = l.id)
      )
  );
$$;
revoke all on function private.course_lesson_is_ready(uuid) from public, anon;
grant execute on function private.course_lesson_is_ready(uuid) to authenticated;

create or replace function private.reject_unready_lesson_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_course_status text;
begin
  select c.status into v_course_status
  from public.course_lessons l
  join public.course_modules m on m.id=l.module_id
  join public.courses c on c.id=m.course_id
  where l.id = new.lesson_id;
  if v_course_status is distinct from 'published'
      or not private.course_lesson_is_ready(new.lesson_id) then
    raise exception 'Aula indisponível: o conteúdo ainda não foi publicado.'
      using errcode='23514';
  end if;
  return new;
end;
$$;
drop trigger if exists lesson_progress_require_ready_content on public.lesson_progress;
create trigger lesson_progress_require_ready_content
  before insert on public.lesson_progress
  for each row execute function private.reject_unready_lesson_completion();

create or replace function private.reject_incomplete_course_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_total integer; v_ready integer;
begin
  if new.status='published' then
    select count(*),count(*) filter (where private.course_lesson_is_ready(l.id))
      into v_total,v_ready
    from public.course_lessons l
    join public.course_modules m on m.id=l.module_id
    where m.course_id=new.id;
    if v_total=0 or v_total<>v_ready then
      raise exception 'Publique conteúdo e materiais reais para todas as aulas antes de publicar o curso.'
        using errcode='23514';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists courses_require_ready_content on public.courses;
create trigger courses_require_ready_content
  before insert or update of status on public.courses
  for each row execute function private.reject_incomplete_course_publication();

-- Unpublished placeholders should not be displayed as lessons.
-- Preserve enrollment and historical progress for review; do not delete user data.
update public.courses c
set status='draft', updated_at=now()
where c.status='published'
  and exists(
    select 1 from public.course_modules m
    join public.course_lessons l on l.module_id=m.id
    where m.course_id=c.id and not private.course_lesson_is_ready(l.id)
  );
