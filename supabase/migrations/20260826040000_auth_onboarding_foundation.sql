begin;

-- Onboarding real sem persistir data de nascimento completa.
alter table public.account_compliance
  add column if not exists age_declared_at timestamptz;

grant update (age_band) on public.account_compliance to authenticated;

drop policy if exists account_compliance_declare_age_once on public.account_compliance;
create policy account_compliance_declare_age_once
on public.account_compliance
for update
to authenticated
using (
  user_id = (select auth.uid())
  and age_band = 'unknown'
)
with check (
  user_id = (select auth.uid())
  and age_band in ('child', 'adolescent', 'adult')
);

create or replace function public.mark_age_declared()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.age_band = 'unknown' and new.age_band <> 'unknown' then
    new.age_declared_at = now();
  end if;
  return new;
end;
$$;

revoke all on function public.mark_age_declared() from public, anon, authenticated;

drop trigger if exists account_compliance_mark_age_declared on public.account_compliance;
create trigger account_compliance_mark_age_declared
before update of age_band on public.account_compliance
for each row execute function public.mark_age_declared();

-- Catálogo de versões jurídicas conhecidas. O cliente pode registrar apenas
-- documentos ativos, nunca inventar uma versão arbitrária.
create table if not exists public.legal_documents (
  document_type text not null,
  document_version text not null,
  active boolean not null default false,
  published_at timestamptz not null default now(),
  audience text not null default 'internal_test',
  primary key (document_type, document_version),
  constraint legal_documents_type check (document_type in ('terms', 'privacy')),
  constraint legal_documents_version_length check (char_length(document_version) between 1 and 50),
  constraint legal_documents_audience_length check (char_length(audience) between 1 and 50)
);

alter table public.legal_documents enable row level security;
revoke all on table public.legal_documents from anon, authenticated;
grant select on table public.legal_documents to authenticated;

create policy legal_documents_select_active
on public.legal_documents
for select
to authenticated
using (active = true);

insert into public.legal_documents (document_type, document_version, active, audience)
values
  ('terms', 'internal-2026-08-26-v1', true, 'internal_test'),
  ('privacy', 'internal-2026-08-26-v1', true, 'internal_test')
on conflict (document_type, document_version) do update
set active = excluded.active,
    audience = excluded.audience;

grant insert (user_id, document_type, document_version, context)
on public.legal_acceptances to authenticated;

create policy legal_acceptances_insert_known_version
on public.legal_acceptances
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.legal_documents d
    where d.document_type = legal_acceptances.document_type
      and d.document_version = legal_acceptances.document_version
      and d.active = true
  )
);

-- O onboarding só termina quando perfil, faixa etária e eventos jurídicos mínimos
-- estão presentes. A conclusão é append-only e pertencente ao próprio usuário.
create table if not exists public.onboarding_completions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now()
);

alter table public.onboarding_completions enable row level security;
revoke all on table public.onboarding_completions from anon, authenticated;
grant select on table public.onboarding_completions to authenticated;
grant insert (user_id) on public.onboarding_completions to authenticated;

create policy onboarding_completions_select_self
on public.onboarding_completions
for select
to authenticated
using (user_id = (select auth.uid()));

create policy onboarding_completions_insert_self_when_ready
on public.onboarding_completions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.display_name <> 'Novo usuário'
      and p.username !~ '^user_[0-9a-f]{20}$'
  )
  and exists (
    select 1
    from public.account_compliance c
    where c.user_id = (select auth.uid())
      and c.age_band in ('child', 'adolescent', 'adult')
      and c.age_declared_at is not null
  )
  and exists (
    select 1
    from public.legal_acceptances a
    join public.legal_documents d
      on d.document_type = a.document_type
     and d.document_version = a.document_version
    where a.user_id = (select auth.uid())
      and a.document_type = 'terms'
      and d.active = true
  )
  and exists (
    select 1
    from public.legal_acceptances a
    join public.legal_documents d
      on d.document_type = a.document_type
     and d.document_version = a.document_version
    where a.user_id = (select auth.uid())
      and a.document_type = 'privacy'
      and d.active = true
  )
);

comment on table public.legal_documents is
  'Catálogo versionado de documentos jurídicos conhecidos pelo produto. As versões internal_* são somente para teste e não substituem textos finais revisados.';
comment on table public.onboarding_completions is
  'Marca que o onboarding técnico mínimo foi concluído. Não significa que todos os gates jurídicos/operacionais de go-live estejam satisfeitos.';
comment on column public.account_compliance.age_declared_at is
  'Momento da declaração única de faixa etária. Não armazena data de nascimento.';

commit;
