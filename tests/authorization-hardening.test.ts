import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260921162000_authorization_hardening.sql",
  "utf8",
);
const productAccessMigration = readFileSync(
  "supabase/migrations/20260921164000_product_access_gate.sql",
  "utf8",
);

describe("authorization hardening", () => {
  it("requires the canonical AAL2 admin predicate for course assets", () => {
    expect(migration).toContain('alter policy "course lesson assets admins delete"');
    expect(migration).toContain('alter policy "course lesson assets admins insert"');
    expect(migration).toContain('alter policy "course lesson assets admins update"');
    expect(migration).toContain('alter policy "course assets admins delete"');
    expect(migration).toContain('alter policy "course assets admins insert"');
    expect(migration).toContain('alter policy "course assets admins update"');
    expect(migration.match(/private\.is_admin\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(migration).not.toContain("from public.admin_memberships a");
  });

  it("requires current project access before an uploader can delete project files", () => {
    expect(migration).toContain('alter policy "project_attachments_delete"');
    expect(migration).toContain("uploaded_by = (select auth.uid())");
    expect(migration).toContain("and private.can_edit_project(project_id)");
    expect(migration).toContain('alter policy "project_assets_delete"');
    expect(migration).toContain("owner_id = ((select auth.uid()))::text");
    expect(migration).toContain("private.can_edit_project");
  });

  it("parses team asset authorization from the storage object path", () => {
    expect(migration).toContain('alter policy "team_assets_select"');
    expect(migration).toContain("storage.foldername(objects.name)");
    expect(migration).not.toContain("storage.foldername(t.name)");
  });

  it("removes unnecessary anonymous and table-level privileges", () => {
    expect(migration).toContain("revoke all on table public.course_lesson_assets from anon");
    expect(migration).toContain("revoke all on table public.investor_verifications from anon");
    expect(migration).toContain("revoke all on table public.project_metrics from anon");
    expect(migration).toContain("revoke all on table public.project_view_events from anon");
    expect(migration).toContain("revoke truncate, trigger, references");
    expect(migration).toContain("revoke execute on function public.get_product_user_context() from anon");
  });

  it("enforces the guardian/product gate at the RLS boundary for normal product writes", () => {
    expect(productAccessMigration).toContain("create or replace function private.has_product_access()");
    expect(productAccessMigration).toContain("c.age_band = 'adult'");
    expect(productAccessMigration).toContain("c.age_band in ('child', 'adolescent')");
    expect(productAccessMigration).toContain("c.guardian_consent_verified_at is not null");
    for (const policy of [
      "direct_conversations_insert_allowed",
      "direct_messages_insert_participant",
      "posts_insert",
      "posts_update",
      "post_comments_insert",
      "post_likes_insert",
      "follows_insert_self",
      "course_enrollments_insert_own_published",
      "lesson_progress_insert_own_enrolled",
      "project_saves_insert_self",
      "project_interests_insert_investor",
      "team_tasks_member_insert",
      "team_tasks_member_update",
    ]) {
      expect(productAccessMigration).toContain(`alter policy "${policy}"`);
    }
    expect(productAccessMigration.match(/private\.has_product_access\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(15);
  });
});
