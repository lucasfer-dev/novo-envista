-- Keep the product-level guardian gate enforceable at the database boundary.
-- This function only evaluates the current caller and is intentionally not parameterized.

create or replace function private.has_product_access()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.account_compliance c
    where c.user_id = (select auth.uid())
      and (
        c.age_band = 'adult'
        or (
          c.age_band in ('child', 'adolescent')
          and c.guardian_consent_verified_at is not null
        )
      )
  );
$function$;

revoke all on function private.has_product_access() from public, anon;
grant execute on function private.has_product_access() to authenticated;

alter policy "direct_conversations_insert_allowed"
on public.direct_conversations
with check (
  private.has_product_access()
  and created_by = (select auth.uid())
  and ((select auth.uid()) = user_a or (select auth.uid()) = user_b)
  and user_a::text < user_b::text
  and exists (
    select 1
    from public.profiles p
    where p.id = case
      when direct_conversations.user_a = (select auth.uid()) then direct_conversations.user_b
      else direct_conversations.user_a
    end
      and p.profile_visibility = 'platform'
      and p.allow_messages = true
  )
  and not exists (
    select 1
    from public.user_blocks b
    where (b.blocker_id = direct_conversations.user_a and b.blocked_id = direct_conversations.user_b)
       or (b.blocker_id = direct_conversations.user_b and b.blocked_id = direct_conversations.user_a)
  )
);

alter policy "direct_messages_insert_participant"
on public.direct_messages
with check (
  private.has_product_access()
  and sender_id = (select auth.uid())
  and exists (
    select 1
    from public.direct_conversations c
    where c.id = direct_messages.conversation_id
      and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
      and not exists (
        select 1 from public.user_blocks b
        where (b.blocker_id = c.user_a and b.blocked_id = c.user_b)
           or (b.blocker_id = c.user_b and b.blocked_id = c.user_a)
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = case
          when c.user_a = (select auth.uid()) then c.user_b
          else c.user_a
        end
          and p.profile_visibility = 'platform'
          and p.allow_messages = true
      )
  )
);

alter policy "posts_insert"
on public.posts
with check (
  private.has_product_access()
  and created_by = (select auth.uid())
  and (
    (
      author_user_id = (select auth.uid())
      and (
        visibility = 'private'
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.profile_visibility = 'platform'
        )
      )
    )
    or (
      author_team_id is not null
      and private.is_team_member(author_team_id)
      and (
        visibility = 'private'
        or exists (
          select 1 from public.teams t
          where t.id = posts.author_team_id
            and t.visibility = 'platform'
        )
      )
    )
  )
);

alter policy "posts_update"
on public.posts
using (
  private.has_product_access()
  and private.can_edit_post(id)
)
with check (
  private.has_product_access()
  and private.can_edit_post(id)
  and (
    (
      author_user_id is not null
      and (
        visibility = 'private'
        or exists (
          select 1 from public.profiles p
          where p.id = posts.author_user_id
            and p.profile_visibility = 'platform'
        )
      )
    )
    or (
      author_team_id is not null
      and (
        visibility = 'private'
        or exists (
          select 1 from public.teams t
          where t.id = posts.author_team_id
            and t.visibility = 'platform'
        )
      )
    )
  )
);

alter policy "post_comments_insert"
on public.post_comments
with check (
  private.has_product_access()
  and user_id = (select auth.uid())
  and private.can_view_post(post_id)
);

alter policy "post_comments_update"
on public.post_comments
using (
  private.has_product_access()
  and user_id = (select auth.uid())
)
with check (
  private.has_product_access()
  and user_id = (select auth.uid())
);

alter policy "post_likes_insert"
on public.post_likes
with check (
  private.has_product_access()
  and user_id = (select auth.uid())
  and private.can_view_post(post_id)
);

alter policy "follows_insert_self"
on public.follows
with check (
  private.has_product_access()
  and follower_id = (select auth.uid())
  and (
    (
      target_profile_id is not null
      and target_profile_id <> (select auth.uid())
      and exists (
        select 1 from public.profiles p
        where p.id = follows.target_profile_id
          and p.profile_visibility = 'platform'
      )
    )
    or (
      target_team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = follows.target_team_id
          and t.visibility = 'platform'
      )
    )
    or (
      target_project_id is not null
      and exists (
        select 1 from public.projects p
        where p.id = follows.target_project_id
          and p.visibility = 'platform'
      )
    )
  )
);

alter policy "course_enrollments_insert_own_published"
on public.course_enrollments
with check (
  private.has_product_access()
  and user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'participant'
  )
  and exists (
    select 1 from public.courses c
    where c.id = course_enrollments.course_id
      and c.status = 'published'
  )
);

alter policy "lesson_progress_insert_own_enrolled"
on public.lesson_progress
with check (
  private.has_product_access()
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    join public.course_enrollments e
      on e.course_id = m.course_id
     and e.user_id = (select auth.uid())
    where l.id = lesson_progress.lesson_id
  )
);

alter policy "project_saves_insert_self"
on public.project_saves
with check (
  private.has_product_access()
  and user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'investor'
  )
  and exists (
    select 1 from public.projects pr
    where pr.id = project_saves.project_id
      and pr.visibility = 'platform'
  )
);

alter policy "project_interests_insert_investor"
on public.project_interests
with check (
  private.has_product_access()
  and investor_id = (select auth.uid())
  and status = 'active'
  and owner_status = 'new'
  and exists (
    select 1 from public.profiles pr
    where pr.id = (select auth.uid())
      and pr.role = 'investor'
  )
  and exists (
    select 1 from public.investor_verifications iv
    where iv.user_id = (select auth.uid())
      and iv.status = 'verified'
  )
  and exists (
    select 1 from public.projects p
    where p.id = project_interests.project_id
      and p.visibility = 'platform'
  )
);

alter policy "team_tasks_member_insert"
on public.team_tasks
with check (
  private.has_product_access()
  and created_by = (select auth.uid())
  and private.is_team_member(team_id, (select auth.uid()))
);

alter policy "team_tasks_member_update"
on public.team_tasks
using (
  (private.has_product_access() and private.is_team_member(team_id, (select auth.uid())))
  or private.is_admin()
)
with check (
  (private.has_product_access() and private.is_team_member(team_id, (select auth.uid())))
  or private.is_admin()
);
