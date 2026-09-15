alter table public.profiles
add column if not exists interest_tags text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.profiles'::regclass
      and conname='profiles_interest_tags_count'
  ) then
    alter table public.profiles
      add constraint profiles_interest_tags_count
      check (cardinality(interest_tags) <= 12);
  end if;
end
$$;

comment on column public.profiles.interest_tags is
  'User-selected public interest/skill tags, maximum 12.';
