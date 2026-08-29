-- Server-side Explore search and pagination.
-- Keeps filtering in Postgres and adds trigram indexes for scalable contains-search.

create extension if not exists pg_trgm with schema extensions;

create index if not exists projects_explore_search_trgm_idx
  on public.projects using gin (
    (lower(
      coalesce(title, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(location, '')
    )) extensions.gin_trgm_ops
  )
  where visibility = 'platform';

create index if not exists projects_explore_stage_updated_idx
  on public.projects(stage, updated_at desc)
  where visibility = 'platform';

create index if not exists projects_explore_tags_idx
  on public.projects using gin(tags)
  where visibility = 'platform';

create index if not exists teams_explore_search_trgm_idx
  on public.teams using gin (
    (lower(
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(institution, '')
    )) extensions.gin_trgm_ops
  )
  where visibility = 'platform';

create index if not exists teams_explore_tags_idx
  on public.teams using gin(tags)
  where visibility = 'platform';

create index if not exists profiles_explore_search_trgm_idx
  on public.profiles using gin (
    (lower(
      coalesce(display_name, '') || ' ' ||
      coalesce(username, '') || ' ' ||
      coalesce(bio, '') || ' ' ||
      coalesce(public_city, '') || ' ' ||
      coalesce(public_state, '') || ' ' ||
      coalesce(public_school, '') || ' ' ||
      coalesce(organization, '') || ' ' ||
      coalesce(organization_type, '')
    )) extensions.gin_trgm_ops
  )
  where profile_visibility = 'platform';

create or replace function public.search_explore_projects(
  search_query text default '',
  stage_filter text default null,
  result_offset integer default 0,
  result_limit integer default 12
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with filtered as (
    select
      project.id,
      project.slug,
      project.title,
      project.short_description,
      project.stage,
      project.category,
      project.location,
      project.tags,
      project.updated_at,
      coalesce(owner_team.name, owner_user.display_name, owner_user.username, 'Envista') as owner
    from public.projects project
    left join public.profiles owner_user on owner_user.id = project.owner_user_id
    left join public.teams owner_team on owner_team.id = project.owner_team_id
    where project.visibility = 'platform'
      and (
        stage_filter is null
        or btrim(stage_filter) = ''
        or project.stage = stage_filter
      )
      and (
        btrim(coalesce(search_query, '')) = ''
        or lower(
          coalesce(project.title, '') || ' ' ||
          coalesce(project.short_description, '') || ' ' ||
          coalesce(project.category, '') || ' ' ||
          coalesce(project.location, '')
        ) like '%' || lower(btrim(search_query)) || '%'
        or project.tags @> array[btrim(search_query)]::text[]
      )
  ), paged as (
    select *
    from filtered
    order by updated_at desc, id desc
    limit least(greatest(coalesce(result_limit, 12), 1), 24)
    offset greatest(coalesce(result_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(item) - 'updated_at' order by item.updated_at desc, item.id desc)
        from paged item
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.search_explore_teams(
  search_query text default '',
  result_offset integer default 0,
  result_limit integer default 12
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with filtered as (
    select
      team.id,
      team.slug,
      team.name,
      team.description,
      team.category,
      team.city,
      team.institution,
      team.tags,
      team.updated_at
    from public.teams team
    where team.visibility = 'platform'
      and (
        btrim(coalesce(search_query, '')) = ''
        or lower(
          coalesce(team.name, '') || ' ' ||
          coalesce(team.description, '') || ' ' ||
          coalesce(team.category, '') || ' ' ||
          coalesce(team.city, '') || ' ' ||
          coalesce(team.institution, '')
        ) like '%' || lower(btrim(search_query)) || '%'
        or team.tags @> array[btrim(search_query)]::text[]
      )
  ), paged as (
    select *
    from filtered
    order by updated_at desc, id desc
    limit least(greatest(coalesce(result_limit, 12), 1), 24)
    offset greatest(coalesce(result_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(item) - 'updated_at' order by item.updated_at desc, item.id desc)
        from paged item
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.search_explore_profiles(
  search_query text default '',
  result_offset integer default 0,
  result_limit integer default 12
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with filtered as (
    select
      profile.id,
      profile.username,
      profile.display_name,
      profile.role::text as role,
      profile.bio,
      case
        when profile.role = 'investor' then
          nullif(concat_ws(' · ', nullif(profile.organization, ''), nullif(profile.organization_type, '')), '')
        else
          nullif(concat_ws(' · ', nullif(profile.public_school, ''), nullif(profile.public_city, ''), nullif(profile.public_state, '')), '')
      end as subtitle
    from public.profiles profile
    where profile.profile_visibility = 'platform'
      and profile.id <> auth.uid()
      and (
        btrim(coalesce(search_query, '')) = ''
        or lower(
          coalesce(profile.display_name, '') || ' ' ||
          coalesce(profile.username, '') || ' ' ||
          coalesce(profile.bio, '') || ' ' ||
          coalesce(profile.public_city, '') || ' ' ||
          coalesce(profile.public_state, '') || ' ' ||
          coalesce(profile.public_school, '') || ' ' ||
          coalesce(profile.organization, '') || ' ' ||
          coalesce(profile.organization_type, '')
        ) like '%' || lower(btrim(search_query)) || '%'
      )
  ), paged as (
    select *
    from filtered
    order by display_name asc nulls last, username asc, id asc
    limit least(greatest(coalesce(result_limit, 12), 1), 24)
    offset greatest(coalesce(result_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(item) order by item.display_name asc nulls last, item.username asc, item.id asc)
        from paged item
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.search_explore_projects(text, text, integer, integer) from public;
revoke all on function public.search_explore_teams(text, integer, integer) from public;
revoke all on function public.search_explore_profiles(text, integer, integer) from public;
revoke all on function public.search_explore_projects(text, text, integer, integer) from anon;
revoke all on function public.search_explore_teams(text, integer, integer) from anon;
revoke all on function public.search_explore_profiles(text, integer, integer) from anon;
grant execute on function public.search_explore_projects(text, text, integer, integer) to authenticated;
grant execute on function public.search_explore_teams(text, integer, integer) to authenticated;
grant execute on function public.search_explore_profiles(text, integer, integer) to authenticated;
