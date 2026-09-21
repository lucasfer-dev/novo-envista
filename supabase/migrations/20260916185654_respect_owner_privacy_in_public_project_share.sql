create or replace function public.get_public_project_share(project_slug text)
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select jsonb_build_object(
    'id',p.id,'slug',p.slug,'title',p.title,'short_description',p.short_description,
    'description',case when nullif(p.readme,'') is not null then p.readme else concat_ws(E'\n\n',nullif(p.problem,''),nullif(p.solution,'')) end,
    'stage',p.stage,'category',p.category,'location',p.location,'tags',p.tags,'updated_at',p.updated_at,
    'repository_url',p.repository_url,'demo_url',p.demo_url,'design_url',p.design_url,
    'owner',case when pr.id is not null and pr.profile_visibility='platform' then jsonb_build_object('name',pr.display_name,'username',pr.username,'headline',pr.headline) else null end,
    'team',case when t.id is not null and t.visibility='platform' then jsonb_build_object('name',t.name,'slug',t.slug) else null end
  )
  from public.projects p
  left join public.profiles pr on pr.id=p.owner_user_id
  left join public.teams t on t.id=p.owner_team_id
  where p.slug=project_slug and p.visibility='platform'
  limit 1;
$function$;
