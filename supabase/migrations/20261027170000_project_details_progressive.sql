-- Dados opcionais do cadastro progressivo. Adição não destrutiva: projetos existentes recebem {}.
-- Aplicar esta migração ANTES do deploy do formulário que envia/consulta a coluna details.
alter table public.projects
  add column if not exists details jsonb not null default '{}'::jsonb;

-- Mantém objeto estruturado e limita o tamanho mesmo em chamadas diretas à API.
alter table public.projects
  add constraint projects_details_object_and_size
  check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 24000);

comment on column public.projects.details is
  'Metadados opcionais do cadastro progressivo: tipo, objetivo, público, diferencial, tecnologias, validação, desafios, metas e interesse em investimento.';

-- A tabela public.projects já utiliza RLS de leitura/escrita por autor ou equipe;
-- nenhuma nova policy, grant ou função security definer é necessária.
