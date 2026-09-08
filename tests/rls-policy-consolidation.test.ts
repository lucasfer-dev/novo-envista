import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260908234500_consolidate_select_rls_policies.sql",
  "utf8",
);

describe("RLS SELECT policy consolidation", () => {
  it("preserves self-or-admin access for private account data", () => {
    expect(migration).toContain("account_compliance_select_self_or_admin");
    expect(migration).toContain("course_enrollments_select_own_or_admin");
    expect(migration).toContain("lesson_progress_select_own_or_admin");
    expect(migration).toContain("project_saves_select_self_or_admin");
    expect(migration).toContain("SELECT auth.uid()");
    expect(migration).toContain("admin_memberships");
  });

  it("keeps participant visibility and admin visibility in a single SELECT policy", () => {
    expect(migration).toContain("posts_select_visible_or_admin");
    expect(migration).toContain("private.can_view_post(id)");
    expect(migration).toContain("projects_select_visible_or_admin");
    expect(migration).toContain("private.can_view_project(id)");
    expect(migration).toContain("teams_select_visible_or_admin");
    expect(migration).toContain("private.is_team_member(id)");
  });

  it("splits course admin mutations so published SELECT can be consolidated safely", () => {
    expect(migration).toContain("courses_select_published_or_admin");
    expect(migration).toContain("courses_admin_insert");
    expect(migration).toContain("courses_admin_update");
    expect(migration).toContain("courses_admin_delete");
    expect(migration).toContain("course_modules_select_published_or_admin");
    expect(migration).toContain("course_lessons_select_published_or_admin");
  });

  it("does not broaden admin access to all direct messages", () => {
    expect(migration).toContain("direct_messages_select_participant_or_reported_admin");
    expect(migration).toContain("message_reports");
    expect(migration).not.toContain("direct_messages_select_admin");
  });
});
