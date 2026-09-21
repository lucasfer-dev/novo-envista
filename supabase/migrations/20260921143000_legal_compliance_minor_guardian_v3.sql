-- Legal/compliance hardening for minor accounts and v3 legal documents.

update public.legal_documents
set active = false
where document_type in ('terms', 'privacy')
  and active = true;

insert into public.legal_documents(document_type, document_version, active, published_at, audience)
values
  ('terms', '2026-09-21-v3', true, now(), 'public'),
  ('privacy', '2026-09-21-v3', true, now(), 'public')
on conflict (document_type, document_version)
do update set active = true, published_at = excluded.published_at, audience = excluded.audience;

create or replace function private.is_participant(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    join public.account_compliance c on c.user_id = p.id
    where p.id = target_user
      and p.role = 'participant'
      and (
        c.age_band = 'adult'
        or (
          c.age_band in ('child', 'adolescent')
          and c.guardian_consent_verified_at is not null
        )
      )
  );
$function$;

alter policy "profiles_update_self"
on public.profiles
with check (
  id = (select auth.uid())
  and (
    (profile_visibility = 'private' and allow_messages = false)
    or exists (
      select 1
      from public.account_compliance c
      where c.user_id = (select auth.uid())
        and (
          c.age_band = 'adult'
          or (
            c.age_band in ('child', 'adolescent')
            and c.guardian_consent_verified_at is not null
            and profiles.allow_messages = false
          )
        )
    )
  )
);

alter policy "onboarding_completions_insert_self_when_ready"
on public.onboarding_completions
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.display_name <> 'Novo usuário'
      and p.username !~ '^user_[0-9a-f]{20}$'
  )
  and exists (
    select 1 from public.account_compliance c
    where c.user_id = (select auth.uid())
      and c.age_band in ('child', 'adolescent', 'adult')
      and c.age_declared_at is not null
      and (
        c.age_band = 'adult'
        or c.guardian_consent_verified_at is not null
      )
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
