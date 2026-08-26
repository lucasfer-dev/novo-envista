create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  instructor text not null default 'Equipe Envista',
  level text not null default 'Iniciante',
  duration_minutes integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint courses_title_length check (char_length(title) between 2 and 160),
  constraint courses_description_length check (char_length(description) <= 3000),
  constraint courses_instructor_length check (char_length(instructor) between 1 and 160),
  constraint courses_level_length check (char_length(level) between 1 and 80),
  constraint courses_duration_nonnegative check (duration_minutes >= 0),
  constraint courses_status_check check (status in ('draft','published','archived'))
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint course_modules_title_length check (char_length(title) between 1 and 160),
  constraint course_modules_position_positive check (position > 0),
  constraint course_modules_unique_position unique (course_id, position)
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  description text not null default '',
  content_md text not null default '',
  position integer not null,
  duration_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  constraint course_lessons_title_length check (char_length(title) between 1 and 180),
  constraint course_lessons_description_length check (char_length(description) <= 3000),
  constraint course_lessons_content_length check (char_length(content_md) <= 50000),
  constraint course_lessons_position_positive check (position > 0),
  constraint course_lessons_duration_nonnegative check (duration_minutes >= 0),
  constraint course_lessons_unique_position unique (module_id, position)
);

create table if not exists public.course_enrollments (
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create table if not exists public.lesson_progress (
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);

create index if not exists course_modules_course_idx on public.course_modules(course_id, position);
create index if not exists course_lessons_module_idx on public.course_lessons(module_id, position);
create index if not exists course_enrollments_user_idx on public.course_enrollments(user_id, enrolled_at desc);
create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id, completed_at desc);

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lesson_progress enable row level security;

revoke all on public.courses, public.course_modules, public.course_lessons, public.course_enrollments, public.lesson_progress from anon;
revoke insert, update, delete on public.courses, public.course_modules, public.course_lessons from authenticated;
grant select on public.courses, public.course_modules, public.course_lessons to authenticated;
grant select, insert, delete on public.course_enrollments to authenticated;
grant select, insert, delete on public.lesson_progress to authenticated;

create policy courses_select_published
on public.courses for select to authenticated
using (status = 'published');

create policy course_modules_select_published_course
on public.course_modules for select to authenticated
using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));

create policy course_lessons_select_published_course
on public.course_lessons for select to authenticated
using (exists (
  select 1 from public.course_modules m join public.courses c on c.id = m.course_id
  where m.id = module_id and c.status = 'published'
));

create policy course_enrollments_select_own
on public.course_enrollments for select to authenticated
using (user_id = (select auth.uid()));

create policy course_enrollments_insert_own_published
on public.course_enrollments for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'participant')
  and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
);

create policy course_enrollments_delete_own
on public.course_enrollments for delete to authenticated
using (user_id = (select auth.uid()));

create policy lesson_progress_select_own
on public.lesson_progress for select to authenticated
using (user_id = (select auth.uid()));

create policy lesson_progress_insert_own_enrolled
on public.lesson_progress for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    join public.course_enrollments e on e.course_id = m.course_id and e.user_id = (select auth.uid())
    where l.id = lesson_id
  )
);

create policy lesson_progress_delete_own
on public.lesson_progress for delete to authenticated
using (user_id = (select auth.uid()));

create trigger courses_touch_updated_at
before update on public.courses
for each row execute function public.touch_updated_at();

insert into public.courses (slug,title,description,instructor,level,duration_minutes,status) values
('da-ideia-ao-projeto','Da ideia ao projeto','Aprenda a transformar um problema real em uma solução estruturada.','Equipe Envista','Iniciante',260,'published'),
('validacao-na-pratica','Validação na prática','Teste hipóteses com pessoas reais e evidências simples.','Equipe Envista','Intermediário',130,'published'),
('apresentar-projeto','Como apresentar seu projeto','Construa apresentações claras para bancas, parceiros e competições.','Equipe Envista','Iniciante',100,'published'),
('introducao-inovacao','Introdução à inovação','Fundamentos para começar a construir soluções.','Equipe Envista','Iniciante',120,'published'),
('preparacao-competicoes','Preparação para competições','Organize equipe, documentação, testes e apresentação.','Equipe Envista','Intermediário',195,'published')
on conflict (slug) do update set title=excluded.title,description=excluded.description,instructor=excluded.instructor,level=excluded.level,duration_minutes=excluded.duration_minutes,status=excluded.status;

insert into public.course_modules(course_id,title,position)
select c.id,v.title,v.position from public.courses c cross join (values
('Encontrando problemas',1),('Validação',2),('Solução',3),('Apresentação',4),('Execução',5),('Projeto final',6)
) v(title,position) where c.slug='da-ideia-ao-projeto'
on conflict (course_id,position) do update set title=excluded.title;
insert into public.course_modules(course_id,title,position) select id,'Fundamentos',1 from public.courses where slug='validacao-na-pratica' on conflict (course_id,position) do update set title=excluded.title;
insert into public.course_modules(course_id,title,position) select id,'Pitch',1 from public.courses where slug='apresentar-projeto' on conflict (course_id,position) do update set title=excluded.title;
insert into public.course_modules(course_id,title,position) select id,'Começo',1 from public.courses where slug='introducao-inovacao' on conflict (course_id,position) do update set title=excluded.title;
insert into public.course_modules(course_id,title,position) select id,'Competir com método',1 from public.courses where slug='preparacao-competicoes' on conflict (course_id,position) do update set title=excluded.title;

insert into public.course_lessons(module_id,title,description,position)
select m.id,v.title,v.description,v.position from public.course_modules m join public.courses c on c.id=m.course_id cross join (values
('O que é um problema real?','Como diferenciar sintomas, ideias e problemas.',1),('Observação','Observe contexto, pessoas e limitações.',2),('Pesquisa','Reúna evidências antes de propor solução.',3)
) v(title,description,position) where c.slug='da-ideia-ao-projeto' and m.position=1
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,v.title,v.description,v.position from public.course_modules m join public.courses c on c.id=m.course_id cross join (values
('Hipóteses','Transforme certezas em hipóteses testáveis.',1),('Entrevistas','Converse sem induzir respostas.',2)
) v(title,description,position) where c.slug='da-ideia-ao-projeto' and m.position=2
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,v.title,v.description,v.position from public.course_modules m join public.courses c on c.id=m.course_id cross join (values
('Proposta de valor','Defina para quem, qual problema e por que agora.',1),('Protótipo','Teste antes de construir demais.',2)
) v(title,description,position) where c.slug='da-ideia-ao-projeto' and m.position=3
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,'Narrativa','Apresente contexto, evidência e solução.',1 from public.course_modules m join public.courses c on c.id=m.course_id where c.slug='da-ideia-ao-projeto' and m.position=4
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,'Plano de próximos passos','Defina prioridades e responsáveis.',1 from public.course_modules m join public.courses c on c.id=m.course_id where c.slug='da-ideia-ao-projeto' and m.position=5
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,'Publicando seu projeto','Transforme o aprendizado em portfólio.',1 from public.course_modules m join public.courses c on c.id=m.course_id where c.slug='da-ideia-ao-projeto' and m.position=6
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;

insert into public.course_lessons(module_id,title,description,position)
select m.id,'Hipóteses e evidências','O que precisa ser verdade?',1 from public.course_modules m join public.courses c on c.id=m.course_id where c.slug='validacao-na-pratica' and m.position=1
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,'Estrutura de uma boa apresentação','Problema, solução, evidência e próximo passo.',1 from public.course_modules m join public.courses c on c.id=m.course_id where c.slug='apresentar-projeto' and m.position=1
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,'Inovação sem mito','Resolver melhor antes de inventar mais.',1 from public.course_modules m join public.courses c on c.id=m.course_id where c.slug='introducao-inovacao' and m.position=1
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
insert into public.course_lessons(module_id,title,description,position)
select m.id,'Critérios e estratégia','Leia regulamentos como requisito de produto.',1 from public.course_modules m join public.courses c on c.id=m.course_id where c.slug='preparacao-competicoes' and m.position=1
on conflict (module_id,position) do update set title=excluded.title,description=excluded.description;
