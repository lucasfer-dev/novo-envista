-- New Envista accounts require a locally valid CPF checked by the server-side
-- Serpro Consulta CPF v3 flow before Supabase Auth creates the user.
-- The full birth date is intentionally not persisted by this migration.
--
-- A short-lived, one-use verification ticket prevents callers from bypassing
-- the Envista server and forging trusted identity metadata through the public
-- Supabase Auth signup endpoint.

alter table public.account_private_identifiers
  add column if not exists verification_provider text,
  add column if not exists verified_at timestamptz;

comment on column public.account_private_identifiers.verification_provider is
  'Server-side identity verification provider used before account creation.';
comment on column public.account_private_identifiers.verified_at is
  'Timestamp at which the signup identity was verified. Full birth date is not stored.';

create table if not exists private.pending_identity_verifications (
  id uuid primary key default extensions.gen_random_uuid(),
  cpf_hash text not null,
  email_hash text not null,
  age_band public.age_band not null,
  provider text not null default 'serpro_cpf_v3',
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '10 minutes'),
  constraint pending_identity_cpf_hash_format check (cpf_hash ~ '^[0-9a-f]{64}$'),
  constraint pending_identity_email_hash_format check (email_hash ~ '^[0-9a-f]{64}$'),
  constraint pending_identity_age_known check (age_band <> 'unknown'::public.age_band),
  constraint pending_identity_provider check (provider = 'serpro_cpf_v3'),
  constraint pending_identity_expiry check (expires_at > created_at)
);

revoke all on table private.pending_identity_verifications from public, anon, authenticated;

create index if not exists pending_identity_verifications_expires_idx
  on private.pending_identity_verifications (expires_at);

create or replace function public.create_pending_identity_verification(
  cpf_value text,
  email_value text,
  age_band_value text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  ticket_id uuid := extensions.gen_random_uuid();
  normalized_cpf text;
  normalized_email text;
  parsed_age public.age_band;
begin
  normalized_cpf := private.normalize_cpf(cpf_value);
  if not private.is_valid_cpf(normalized_cpf) then
    raise exception using errcode = '22023', message = 'invalid cpf';
  end if;

  normalized_email := pg_catalog.lower(pg_catalog.btrim(email_value));
  if normalized_email = '' or pg_catalog.char_length(normalized_email) > 254 then
    raise exception using errcode = '22023', message = 'invalid email';
  end if;

  parsed_age := case age_band_value
    when 'child' then 'child'::public.age_band
    when 'adolescent' then 'adolescent'::public.age_band
    when 'adult' then 'adult'::public.age_band
    else null
  end;
  if parsed_age is null then
    raise exception using errcode = '22023', message = 'invalid age band';
  end if;

  -- Opportunistic cleanup keeps the short-lived private table bounded without
  -- requiring a scheduler for correctness.
  delete from private.pending_identity_verifications
  where expires_at <= clock_timestamp();

  insert into private.pending_identity_verifications (
    id,
    cpf_hash,
    email_hash,
    age_band,
    provider
  )
  values (
    ticket_id,
    private.cpf_identifier_hash(normalized_cpf),
    pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(normalized_email, 'UTF8'), 'sha256'),
      'hex'
    ),
    parsed_age,
    'serpro_cpf_v3'
  );

  return ticket_id;
end;
$$;

revoke all on function public.create_pending_identity_verification(text,text,text)
  from public, anon, authenticated;
grant execute on function public.create_pending_identity_verification(text,text,text)
  to service_role;

comment on function public.create_pending_identity_verification(text,text,text) is
  'Service-role-only issuer for one-use signup identity tickets after a successful Serpro CPF v3 check.';

create or replace function private.capture_signup_cpf()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_cpf text;
  normalized_cpf text;
  raw_ticket text;
  ticket_id uuid;
  expected_cpf_hash text;
  expected_email_hash text;
  pending private.pending_identity_verifications%rowtype;
begin
  raw_cpf := new.raw_user_meta_data ->> 'cpf';
  raw_ticket := new.raw_user_meta_data ->> 'verification_id';

  if raw_cpf is null or pg_catalog.btrim(raw_cpf) = '' then
    raise exception using errcode = '22023', message = 'cpf required for signup';
  end if;

  normalized_cpf := private.normalize_cpf(raw_cpf);
  if not private.is_valid_cpf(normalized_cpf) then
    raise exception using errcode = '22023', message = 'invalid signup identifier';
  end if;

  if raw_ticket is null or pg_catalog.btrim(raw_ticket) = '' then
    raise exception using errcode = '22023', message = 'identity verification required';
  end if;

  begin
    ticket_id := raw_ticket::uuid;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'identity verification required';
  end;

  expected_cpf_hash := private.cpf_identifier_hash(normalized_cpf);
  expected_email_hash := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(new.email, ''))), 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  select *
    into pending
  from private.pending_identity_verifications p
  where p.id = ticket_id
    and p.cpf_hash = expected_cpf_hash
    and p.email_hash = expected_email_hash
    and p.expires_at > clock_timestamp()
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'identity verification required';
  end if;

  insert into public.account_private_identifiers (
    user_id,
    cpf_hash,
    verification_provider,
    verified_at
  )
  values (
    new.id,
    expected_cpf_hash,
    pending.provider,
    pending.created_at
  );

  -- Only the database promotes these values to trusted metadata. Public clients
  -- cannot gain a verified age/provider by sending arbitrary metadata.
  new.raw_user_meta_data :=
    (pg_catalog.coalesce(new.raw_user_meta_data, '{}'::jsonb)
      - 'cpf'
      - 'verification_id'
      - 'verified_age_band'
      - 'identity_provider')
    || pg_catalog.jsonb_build_object(
      'verified_age_band', pending.age_band::text,
      'identity_provider', pending.provider
    );

  delete from private.pending_identity_verifications where id = pending.id;
  return new;
end;
$$;

revoke all on function private.capture_signup_cpf() from public, anon, authenticated;
grant execute on function private.capture_signup_cpf() to supabase_auth_admin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.account_role;
  safe_display_name text;
  verified_age public.age_band;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'investor' then 'investor'::public.account_role
    else 'participant'::public.account_role
  end;

  safe_display_name := pg_catalog.left(
    pg_catalog.coalesce(
      pg_catalog.nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      'Novo usuário'
    ),
    100
  );

  verified_age := case new.raw_user_meta_data ->> 'verified_age_band'
    when 'child' then 'child'::public.age_band
    when 'adolescent' then 'adolescent'::public.age_band
    when 'adult' then 'adult'::public.age_band
    else 'unknown'::public.age_band
  end;

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    'user_' || pg_catalog.substring(pg_catalog.replace(new.id::text, '-', '') from 1 for 20),
    safe_display_name,
    requested_role
  )
  on conflict (id) do nothing;

  insert into public.account_compliance (user_id, age_band, age_declared_at)
  values (
    new.id,
    verified_age,
    case when verified_age = 'unknown'::public.age_band then null else clock_timestamp() end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Promote the privacy/terms version because required identity verification is a
-- material change to the signup data flow.
update public.legal_documents
set active = false
where document_type in ('terms', 'privacy') and active = true;

insert into public.legal_documents (document_type, document_version, active, audience, published_at)
values
  ('terms', '2026-09-11-v2', true, 'public', now()),
  ('privacy', '2026-09-11-v2', true, 'public', now())
on conflict (document_type, document_version) do update
set active = excluded.active,
    audience = excluded.audience,
    published_at = excluded.published_at;
