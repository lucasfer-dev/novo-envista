-- Authorization hardening: require MFA for admin-owned course assets, tighten
-- project file deletion after access revocation, fix team asset reads, and reduce
-- unnecessary public-schema privileges.

-- Admin-only lesson asset metadata must follow the same AAL2 requirement as
-- the rest of the admin surface.
alter policy "course lesson assets admins delete"
on public.course_lesson_assets
using (private.is_admin());

alter policy "course lesson assets admins insert"
on public.course_lesson_assets
with check (private.is_admin());

alter policy "course lesson assets admins update"
on public.course_lesson_assets
using (private.is_admin())
with check (private.is_admin());

alter policy "course lesson assets enrolled read"
on public.course_lesson_assets
using (
  private.is_admin()
  or exists (
    select 1
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    join public.course_enrollments e
      on e.course_id = c.id
     and e.user_id = (select auth.uid())
    where l.id = course_lesson_assets.lesson_id
      and c.status = 'published'
  )
);

-- The storage bucket must not become an MFA bypass for admin writes.
alter policy "course assets admins delete"
on storage.objects
using (
  bucket_id = 'course-assets'
  and private.is_admin()
);

alter policy "course assets admins insert"
on storage.objects
with check (
  bucket_id = 'course-assets'
  and private.is_admin()
);

alter policy "course assets admins update"
on storage.objects
using (
  bucket_id = 'course-assets'
  and private.is_admin()
)
with check (
  bucket_id = 'course-assets'
  and private.is_admin()
);

alter policy "course assets authorized read"
on storage.objects
using (
  bucket_id = 'course-assets'
  and (
    private.is_admin()
    or exists (
      select 1
      from public.course_lesson_assets cla
      join public.course_lessons l on l.id = cla.lesson_id
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      join public.course_enrollments e
        on e.course_id = c.id
       and e.user_id = (select auth.uid())
      where cla.path = objects.name
        and c.status = 'published'
    )
  )
);

-- Upload authors only keep deletion rights while they still have current
-- project edit access. Team managers/project owners retain management rights.
alter policy "project_attachments_delete"
on public.project_attachments
using (
  (
    uploaded_by = (select auth.uid())
    and private.can_edit_project(project_id)
  )
  or private.can_manage_project_files(project_id)
);

alter policy "project_assets_delete"
on storage.objects
using (
  bucket_id = 'project-assets'
  and (
    (
      owner_id = ((select auth.uid()))::text
      and private.can_edit_project(
        private.safe_uuid((storage.foldername(name))[1])
      )
    )
    or private.can_manage_project_files(
      private.safe_uuid((storage.foldername(name))[1])
    )
  )
);

-- Fix the team asset read policy: folder parsing must use the object path,
-- not the team's display name.
alter policy "team_assets_select"
on storage.objects
using (
  bucket_id = 'team-assets'
  and exists (
    select 1
    from public.teams t
    where t.id = private.safe_uuid((storage.foldername(objects.name))[1])
      and (
        t.visibility = 'platform'
        or private.is_team_member(t.id)
      )
  )
);

-- Anonymous callers had broad table grants on tables with no anon RLS policy.
-- Remove those grants entirely; the intended anonymous surfaces are the
-- public project/profile/team columns and the privacy contact INSERT policy.
revoke all on table public.course_lesson_assets from anon;
revoke all on table public.investor_verifications from anon;
revoke all on table public.project_metrics from anon;
revoke all on table public.project_view_events from anon;

-- RLS governs row access, but application roles do not need table-level DDL-ish
-- privileges. Removing these reduces blast radius if a future RPC is miswritten.
do $$
declare rec record;
begin
  for rec in
    select quote_ident(n.nspname) as schema_name, quote_ident(c.relname) as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r','p')
  loop
    execute format(
      'revoke truncate, trigger, references on table %s.%s from anon, authenticated',
      rec.schema_name,
      rec.table_name
    );
  end loop;
end
$$;

-- Only the public share RPC should be callable before authentication.
revoke execute on function public.get_product_user_context() from anon;
