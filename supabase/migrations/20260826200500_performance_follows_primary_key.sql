-- Adiciona uma chave primária técnica sem alterar o modelo polimórfico de follows.
-- Inserts existentes continuam funcionando porque o UUID é gerado automaticamente.

alter table public.follows
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.follows
  add constraint follows_pkey primary key (id);
