-- Um perfil/equipe privado não pode publicar um post marcado como visível para toda a plataforma.
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated
with check (
  created_by=(select auth.uid()) and (
    (
      author_user_id=(select auth.uid())
      and (visibility='private' or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.profile_visibility='platform'))
    )
    or (
      author_team_id is not null
      and private.is_team_member(author_team_id)
      and (visibility='private' or exists(select 1 from public.teams t where t.id=author_team_id and t.visibility='platform'))
    )
  )
);

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
using (private.can_edit_post(id))
with check (
  private.can_edit_post(id) and (
    (author_user_id is not null and (visibility='private' or exists(select 1 from public.profiles p where p.id=author_user_id and p.profile_visibility='platform')))
    or (author_team_id is not null and (visibility='private' or exists(select 1 from public.teams t where t.id=author_team_id and t.visibility='platform')))
  )
);
