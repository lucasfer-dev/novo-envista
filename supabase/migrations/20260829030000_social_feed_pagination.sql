-- Paginate the mixed Social timeline in Postgres instead of loading large
-- independent post/project batches and merging them in Node.

create extension if not exists pg_trgm with schema extensions;

create index if not exists posts_feed_body_trgm_idx
  on public.posts using gin ((lower(body)) extensions.gin_trgm_ops);

create index if not exists projects_feed_updated_idx
  on public.projects(updated_at desc, id desc);

create or replace function public.get_social_feed_refs(
  feed_mode text default 'for-you',
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
  with post_base as (
    select
      'post'::text as kind,
      post.id,
      post.created_at as activity_at,
      (
        post.author_user_id = auth.uid()
        or post.created_by = auth.uid()
        or (
          post.author_team_id is not null
          and exists (
            select 1 from public.team_members member
            where member.team_id = post.author_team_id
              and member.user_id = auth.uid()
          )
        )
        or exists (
          select 1 from public.follows follow
          where follow.follower_id = auth.uid()
            and (
              follow.target_profile_id = post.author_user_id
              or follow.target_team_id = post.author_team_id
              or follow.target_project_id = post.project_id
            )
        )
      ) as followed
    from public.posts post
    where
      btrim(coalesce(search_query, '')) = ''
      or lower(post.body) like '%' || lower(btrim(search_query)) || '%'
      or exists (
        select 1 from public.profiles author
        where author.id = post.author_user_id
          and lower(coalesce(author.display_name, '') || ' ' || coalesce(author.username, ''))
              like '%' || lower(btrim(search_query)) || '%'
      )
      or exists (
        select 1 from public.teams author_team
        where author_team.id = post.author_team_id
          and lower(author_team.name) like '%' || lower(btrim(search_query)) || '%'
      )
      or exists (
        select 1 from public.projects linked_project
        where linked_project.id = post.project_id
          and lower(linked_project.title) like '%' || lower(btrim(search_query)) || '%'
      )
  ), post_candidates as (
    select * from post_base
    where feed_mode <> 'following' or followed
  ), project_base as (
    select
      'project-update'::text as kind,
      project.id,
      project.updated_at as activity_at,
      (
        project.owner_user_id = auth.uid()
        or (
          project.owner_team_id is not null
          and exists (
            select 1 from public.team_members member
            where member.team_id = project.owner_team_id
              and member.user_id = auth.uid()
          )
        )
        or exists (
          select 1 from public.follows follow
          where follow.follower_id = auth.uid()
            and (
              follow.target_profile_id = project.owner_user_id
              or follow.target_team_id = project.owner_team_id
              or follow.target_project_id = project.id
            )
        )
      ) as followed
    from public.projects project
    where
      btrim(coalesce(search_query, '')) = ''
      or lower(
        coalesce(project.title, '') || ' ' ||
        coalesce(project.short_description, '') || ' ' ||
        coalesce(project.category, '') || ' ' ||
        coalesce(project.location, '')
      ) like '%' || lower(btrim(search_query)) || '%'
      or project.tags @> array[btrim(search_query)]::text[]
  ), project_candidates as (
    select * from project_base
    where feed_mode <> 'following' or followed
  ), all_items as (
    select * from post_candidates
    union all
    select * from project_candidates
  ), paged as (
    select *
    from all_items
    order by activity_at desc, kind asc, id desc
    limit least(greatest(coalesce(result_limit, 12), 1), 30)
    offset greatest(coalesce(result_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from all_items),
    'refs', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'kind', item.kind,
            'id', item.id,
            'activity_at', item.activity_at,
            'followed', item.followed
          )
          order by item.activity_at desc, item.kind asc, item.id desc
        )
        from paged item
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.get_social_feed_refs(text, text, integer, integer) from public;
revoke all on function public.get_social_feed_refs(text, text, integer, integer) from anon;
grant execute on function public.get_social_feed_refs(text, text, integer, integer) to authenticated;
