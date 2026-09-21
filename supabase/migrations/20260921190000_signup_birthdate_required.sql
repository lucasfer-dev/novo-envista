-- Require date of birth during signup, derive only the minimum age band needed
-- for product protections, and remove the exact date from auth metadata in the
-- same transaction. The full birth date is intentionally not persisted.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.account_role;
  safe_display_name text;
  raw_birth_date text;
  birth_date date;
  calculated_age integer;
  derived_age_band public.age_band;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'investor'
      then 'investor'::public.account_role
    else 'participant'::public.account_role
  end;

  safe_display_name := pg_catalog.left(
    pg_catalog.coalesce(
      pg_catalog.nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      'Novo usuário'
    ),
    100
  );

  raw_birth_date := new.raw_user_meta_data ->> 'birth_date';
  if raw_birth_date is null or raw_birth_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end if;

  begin
    birth_date := raw_birth_date::date;
  exception when others then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end;

  if birth_date > current_date
     or birth_date < (current_date - interval '120 years')::date then
    raise exception using errcode = '22023', message = 'invalid signup birth date';
  end if;

  calculated_age := pg_catalog.date_part('year', pg_catalog.age(current_date, birth_date))::integer;
  derived_age_band := case
    when calculated_age < 12 then 'child'::public.age_band
    when calculated_age < 18 then 'adolescent'::public.age_band
    else 'adult'::public.age_band
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
  values (new.id, derived_age_band, pg_catalog.now())
  on conflict (user_id) do update
  set
    age_band = excluded.age_band,
    age_declared_at = pg_catalog.coalesce(public.account_compliance.age_declared_at, excluded.age_declared_at);

  -- Keep only the derived age band in the dedicated compliance table.
  update auth.users
  set raw_user_meta_data = pg_catalog.coalesce(raw_user_meta_data, '{}'::jsonb) - 'birth_date'
  where id = new.id;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

comment on table public.account_compliance is
  'Dados mínimos de conformidade. A data de nascimento é exigida no cadastro para derivar a faixa etária, mas a data completa é descartada na mesma transação e não é persistida.';
