import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260921162000_authorization_hardening.sql",
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
});
