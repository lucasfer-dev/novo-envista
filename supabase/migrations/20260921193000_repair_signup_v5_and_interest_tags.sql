-- Repair accounts created while signup v5 metadata sanitization was not yet active
-- and allow users to persist interest tags from onboarding/profile.

grant update (interest_tags) on public.profiles to authenticated;

with signup_rows as (
  select
    u.id,
    u.raw_user_meta_data,
    case
      when (u.raw_user_meta_data ->> 'birth_date') ~ '^\d{4}-\d{2}-\d{2}$'
        then (u.raw_user_meta_data ->> 'birth_date')::date
      else null
    end as birth_date
  from auth.users u
  where u.raw_user_meta_data ? 'birth_date'
)
update public.account_compliance c
set
  age_band = case
    when pg_catalog.date_part('year', pg_catalog.age(current_date, s.birth_date))::integer < 12 then 'child'::public.age_band
    when pg_catalog.date_part('year', pg_catalog.age(current_date, s.birth_date))::integer < 18 then 'adolescent'::public.age_band
    else 'adult'::public.age_band
  end,
  age_declared_at = pg_catalog.coalesce(c.age_declared_at, pg_catalog.now())
from signup_rows s
where c.user_id = s.id
  and s.birth_date is not null
  and s.birth_date <= current_date
  and s.birth_date >= (current_date - interval '120 years')::date
  and c.age_band = 'unknown';

insert into public.legal_acceptances(user_id, document_type, document_version, context)
select u.id, 'terms', u.raw_user_meta_data ->> 'signup_terms_version', 'signup_terms_acceptance'
from auth.users u
where pg_catalog.coalesce((u.raw_user_meta_data ->> 'signup_terms_accepted')::boolean, false)
  and u.raw_user_meta_data ->> 'signup_terms_version' = '2026-09-21-v5'
on conflict (user_id, document_type, document_version) do nothing;

insert into public.legal_acceptances(user_id, document_type, document_version, context)
select u.id, 'privacy', u.raw_user_meta_data ->> 'signup_privacy_version', 'signup_privacy_acknowledgement'
from auth.users u
where pg_catalog.coalesce((u.raw_user_meta_data ->> 'signup_privacy_acknowledged')::boolean, false)
  and u.raw_user_meta_data ->> 'signup_privacy_version' = '2026-09-21-v5'
on conflict (user_id, document_type, document_version) do nothing;

update auth.users u
set raw_user_meta_data = pg_catalog.coalesce(u.raw_user_meta_data, '{}'::jsonb)
  - 'cpf'
  - 'cnpj'
  - 'birth_date'
  - 'signup_terms_accepted'
  - 'signup_terms_version'
  - 'signup_privacy_acknowledged'
  - 'signup_privacy_version'
where (
  u.raw_user_meta_data ? 'birth_date'
  or u.raw_user_meta_data ? 'signup_terms_accepted'
  or u.raw_user_meta_data ? 'signup_privacy_acknowledged'
  or (
    (u.raw_user_meta_data ? 'cpf' or u.raw_user_meta_data ? 'cnpj')
    and exists (
      select 1
      from public.account_private_identifiers api
      where api.user_id = u.id
        and (api.cpf_hash is not null or api.cnpj_hash is not null)
    )
  )
);
