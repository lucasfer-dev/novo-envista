-- Consolidate equivalent permissive SELECT policies into one OR expression per table.
-- This preserves the existing authorization semantics while avoiding repeated policy
-- evaluation reported by the Supabase performance advisor.

-- account_compliance
DROP POLICY IF EXISTS account_compliance_select_admin ON public.account_compliance;
DROP POLICY IF EXISTS account_compliance_select_self ON public.account_compliance;
CREATE POLICY account_compliance_select_self_or_admin
ON public.account_compliance FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);

-- admin_memberships: RLS is default-deny when no policy applies, so the explicit
-- permissive false policy is redundant and caused an unnecessary duplicate check.
DROP POLICY IF EXISTS admin_memberships_explicit_deny ON public.admin_memberships;

-- content_reports
DROP POLICY IF EXISTS content_reports_select_admin ON public.content_reports;
DROP POLICY IF EXISTS content_reports_select_own ON public.content_reports;
CREATE POLICY content_reports_select_own_or_admin
ON public.content_reports FOR SELECT TO authenticated
USING (
  reporter_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships admin
    WHERE admin.user_id = (SELECT auth.uid())
  )
);

-- course_enrollments
DROP POLICY IF EXISTS course_enrollments_select_admin ON public.course_enrollments;
DROP POLICY IF EXISTS course_enrollments_select_own ON public.course_enrollments;
CREATE POLICY course_enrollments_select_own_or_admin
ON public.course_enrollments FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships admin
    WHERE admin.user_id = (SELECT auth.uid())
  )
);

-- courses: split admin ALL into mutation policies so SELECT can be consolidated.
DROP POLICY IF EXISTS courses_admin_all ON public.courses;
DROP POLICY IF EXISTS courses_select_published ON public.courses;
CREATE POLICY courses_select_published_or_admin
ON public.courses FOR SELECT TO authenticated
USING (
  status = 'published'
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);
CREATE POLICY courses_admin_insert
ON public.courses FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));
CREATE POLICY courses_admin_update
ON public.courses FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));
CREATE POLICY courses_admin_delete
ON public.courses FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));

-- course_modules
DROP POLICY IF EXISTS course_modules_admin_all ON public.course_modules;
DROP POLICY IF EXISTS course_modules_select_published_course ON public.course_modules;
CREATE POLICY course_modules_select_published_or_admin
ON public.course_modules FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_modules.course_id AND c.status = 'published'
  )
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);
CREATE POLICY course_modules_admin_insert
ON public.course_modules FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));
CREATE POLICY course_modules_admin_update
ON public.course_modules FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));
CREATE POLICY course_modules_admin_delete
ON public.course_modules FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));

-- course_lessons
DROP POLICY IF EXISTS course_lessons_admin_all ON public.course_lessons;
DROP POLICY IF EXISTS course_lessons_select_published_course ON public.course_lessons;
CREATE POLICY course_lessons_select_published_or_admin
ON public.course_lessons FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = course_lessons.module_id AND c.status = 'published'
  )
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);
CREATE POLICY course_lessons_admin_insert
ON public.course_lessons FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));
CREATE POLICY course_lessons_admin_update
ON public.course_lessons FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));
CREATE POLICY course_lessons_admin_delete
ON public.course_lessons FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_memberships a
  WHERE a.user_id = (SELECT auth.uid())
));

-- direct_messages
DROP POLICY IF EXISTS direct_messages_select_participant ON public.direct_messages;
DROP POLICY IF EXISTS direct_messages_select_reported_admin ON public.direct_messages;
CREATE POLICY direct_messages_select_participant_or_reported_admin
ON public.direct_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.direct_conversations c
    WHERE c.id = direct_messages.conversation_id
      AND ((SELECT auth.uid()) = c.user_a OR (SELECT auth.uid()) = c.user_b)
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.admin_memberships a
      WHERE a.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.message_reports r
      WHERE r.message_id = direct_messages.id
    )
  )
);

-- lesson_progress
DROP POLICY IF EXISTS lesson_progress_select_admin ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_select_own ON public.lesson_progress;
CREATE POLICY lesson_progress_select_own_or_admin
ON public.lesson_progress FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships admin
    WHERE admin.user_id = (SELECT auth.uid())
  )
);

-- message_reports
DROP POLICY IF EXISTS message_reports_select_admin ON public.message_reports;
DROP POLICY IF EXISTS message_reports_select_own ON public.message_reports;
CREATE POLICY message_reports_select_own_or_admin
ON public.message_reports FOR SELECT TO authenticated
USING (
  reporter_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);

-- posts: admin already had access to every row, so the separate reported-admin
-- SELECT policy was redundant.
DROP POLICY IF EXISTS posts_select ON public.posts;
DROP POLICY IF EXISTS posts_select_admin ON public.posts;
DROP POLICY IF EXISTS posts_select_reported_admin ON public.posts;
CREATE POLICY posts_select_visible_or_admin
ON public.posts FOR SELECT TO authenticated
USING (
  private.can_view_post(id)
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);

-- profiles
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_select_reported_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_select_self_or_platform ON public.profiles;
DROP POLICY IF EXISTS profiles_team_colleagues_select ON public.profiles;
CREATE POLICY profiles_select_visible_colleague_or_admin
ON public.profiles FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR profile_visibility = 'platform'
  OR private.shares_team_with(id)
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);

-- project_interests
DROP POLICY IF EXISTS project_interests_select_admin ON public.project_interests;
DROP POLICY IF EXISTS project_interests_select_involved ON public.project_interests;
CREATE POLICY project_interests_select_involved_or_admin
ON public.project_interests FOR SELECT TO authenticated
USING (
  investor_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_interests.project_id
      AND (
        p.owner_user_id = (SELECT auth.uid())
        OR (p.owner_team_id IS NOT NULL AND private.is_team_member(p.owner_team_id, (SELECT auth.uid())))
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships admin
    WHERE admin.user_id = (SELECT auth.uid())
  )
);

-- project_saves
DROP POLICY IF EXISTS project_saves_select_admin ON public.project_saves;
DROP POLICY IF EXISTS project_saves_select_self ON public.project_saves;
CREATE POLICY project_saves_select_self_or_admin
ON public.project_saves FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships admin
    WHERE admin.user_id = (SELECT auth.uid())
  )
);

-- projects: admin already had access to every row, so the separate reported-admin
-- SELECT policy was redundant.
DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_select_admin ON public.projects;
DROP POLICY IF EXISTS projects_select_reported_admin ON public.projects;
CREATE POLICY projects_select_visible_or_admin
ON public.projects FOR SELECT TO authenticated
USING (
  private.can_view_project(id)
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);

-- team_members
DROP POLICY IF EXISTS team_members_select ON public.team_members;
DROP POLICY IF EXISTS team_members_select_admin ON public.team_members;
CREATE POLICY team_members_select_visible_or_admin
ON public.team_members FOR SELECT TO authenticated
USING (
  private.is_team_member(team_id)
  OR EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id AND t.visibility = 'platform'
  )
  OR private.is_admin()
);

-- teams: admin already had access to every row, so the separate reported-admin
-- SELECT policy was redundant.
DROP POLICY IF EXISTS teams_select ON public.teams;
DROP POLICY IF EXISTS teams_select_admin ON public.teams;
DROP POLICY IF EXISTS teams_select_reported_admin ON public.teams;
CREATE POLICY teams_select_visible_or_admin
ON public.teams FOR SELECT TO authenticated
USING (
  visibility = 'platform'
  OR owner_id = (SELECT auth.uid())
  OR private.is_team_member(id)
  OR EXISTS (
    SELECT 1 FROM public.admin_memberships a
    WHERE a.user_id = (SELECT auth.uid())
  )
);
