create or replace function public.get_product_user_context()
returns table (
  id uuid,
  username text,
  display_name text,
  role text,
  avatar_path text,
  bio text,
  public_city text,
  public_state text,
  public_school text,
  organization text,
  organization_type text,
  age_band text,
  guardian_consent_verified_at timestamptz,
  onboarding_completed boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.role::text,
    p.avatar_path,
    p.bio,
    p.public_city,
    p.public_state,
    p.public_school,
    p.organization,
    p.organization_type,
    c.age_band::text,
    c.guardian_consent_verified_at,
    (o.user_id is not null) as onboarding_completed
  from public.profiles p
  left join public.account_compliance c on c.user_id = p.id
  left join public.onboarding_completions o on o.user_id = p.id
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_product_user_context() from public;
grant execute on function public.get_product_user_context() to authenticated;
