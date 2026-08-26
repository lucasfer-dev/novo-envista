begin;

-- Segurança e privacidade por padrão para as primeiras contas reais do Envista.
-- Campos de diretório ficam em profiles; dados de conformidade ficam separados.

create type public.account_role as enum ('participant', 'investor');
create type public.profile_visibility as enum ('platform', 'private');
create type public.age_band as enum ('unknown', 'child', 'adolescent', 'adult');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default 'Novo usuário',
  role public.account_role not null default 'participant',
  avatar_path text,
  bio text,
  public_city text,
  public_state text,
  public_school text,
  organization text,
  organization_type text,
  profile_visibility public.profile_visibility not null default 'private',
  allow_messages boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 100),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  constraint profiles_avatar_path_length check (avatar_path is null or char_length(avatar_path) <= 512),
  constraint profiles_city_length check (public_city is null or char_length(public_city) <= 100),
  constraint profiles_state_length check (public_state is null or char_length(public_state) <= 100),
  constraint profiles_school_length check (public_school is null or char_length(public_school) <= 160),
  constraint profiles_organization_length check (organization is null or char_length(organization) <= 160),
  constraint profiles_organization_type_length check (organization_type is null or char_length(organization_type) <= 100)
);

comment on table public.profiles is
  'Somente dados destinados ao diretório da plataforma. Não armazenar e-mail, telefone, data de nascimento ou segredos aqui.';

create table public.account_compliance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age_band public.age_band not null default 'unknown',
  guardian_consent_verified_at timestamptz,
  guardian_consent_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_compliance_guardian_reference_length check (
    guardian_consent_reference is null or char_length(guardian_consent_reference) <= 200
  )
);

comment on table public.account_compliance is
  'Dados mínimos de conformidade. A data de nascimento completa não é persistida; o fluxo futuro deve calcular a faixa etária no servidor e descartar a data exata.';

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  document_version text not null,
  context text not null default 'web',
  accepted_at timestamptz not null default now(),
  constraint legal_acceptances_document_type check (document_type in ('terms', 'privacy')),
  constraint legal_acceptances_document_version_length check (char_length(document_version) between 1 and 50),
  constraint legal_acceptances_context_length check (char_length(context) between 1 and 50),
  constraint legal_acceptances_unique_version unique (user_id, document_type, document_version)
);

comment on table public.legal_acceptances is
  'Registro imutável de aceite do próprio titular para versões de Termos e Aviso de Privacidade. Consentimento de responsável legal não é registrado por esta tabela.';

create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint admin_memberships_reason_length check (reason is null or char_length(reason) <= 300)
);

comment on table public.admin_memberships is
  'Privilégio administrativo separado do perfil. Usuários nunca podem se promover a admin pelo cliente.';

alter table public.profiles enable row level security;
alter table public.account_compliance enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.admin_memberships enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.account_compliance from anon, authenticated;
revoke all on table public.legal_acceptances from anon, authenticated;
revoke all on table public.admin_memberships from anon, authenticated;

-- Perfis: nenhuma leitura anônima nesta fase. Usuários autenticados veem o próprio
-- perfil ou perfis que optaram por aparecer no diretório da plataforma.
grant select on table public.profiles to authenticated;
grant update (
  username,
  display_name,
  avatar_path,
  bio,
  public_city,
  public_state,
  public_school,
  organization,
  organization_type,
  profile_visibility,
  allow_messages
) on public.profiles to authenticated;

create policy profiles_select_self_or_platform
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or profile_visibility = 'platform'
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Conformidade: o titular pode consultar seu status, mas não pode fabricar faixa
-- etária, consentimento de responsável ou privilégios via browser.
grant select on table public.account_compliance to authenticated;

create policy account_compliance_select_self
on public.account_compliance
for select
to authenticated
using (user_id = (select auth.uid()));

-- Aceites: append-only. O horário vem do banco e não pode ser sobrescrito pelo cliente.
grant select on table public.legal_acceptances to authenticated;
grant insert (user_id, document_type, document_version, context)
on public.legal_acceptances to authenticated;

create policy legal_acceptances_select_self
on public.legal_acceptances
for select
to authenticated
using (user_id = (select auth.uid()));

create policy legal_acceptances_insert_self
on public.legal_acceptances
for insert
to authenticated
with check (user_id = (select auth.uid()));

-- Admin: sem grants/policies para anon/authenticated. Apenas operações confiáveis
-- (dashboard/migration/servidor privilegiado futuro) podem conceder o papel.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger account_compliance_touch_updated_at
before update on public.account_compliance
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.account_role;
  safe_display_name text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'investor'
      then 'investor'::public.account_role
    else 'participant'::public.account_role
  end;

  safe_display_name := left(
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 'Novo usuário'),
    100
  );

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    'user_' || substring(replace(new.id::text, '-', '') from 1 for 20),
    safe_display_name,
    requested_role
  )
  on conflict (id) do nothing;

  insert into public.account_compliance (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index profiles_visibility_idx on public.profiles (profile_visibility);
create index profiles_role_idx on public.profiles (role);
create index legal_acceptances_user_idx on public.legal_acceptances (user_id, accepted_at desc);

-- Storage: bucket privado, limite pequeno e tipos de imagem explícitos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select_visible_profile
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and exists (
    select 1
    from public.profiles p
    where p.id::text = (storage.foldername(name))[1]
      and (
        p.id = (select auth.uid())
        or p.profile_visibility = 'platform'
      )
  )
);

create policy avatars_insert_own_folder
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_update_own_objects
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_delete_own_objects
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
);

commit;
