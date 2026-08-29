import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("public content moderation", () => {
  it("creates a RLS-protected polymorphic report queue", () => {
    const migration = read("supabase/migrations/20260829043000_content_moderation.sql");
    expect(migration).toContain("create table if not exists public.content_reports");
    expect(migration).toContain("alter table public.content_reports enable row level security");
    expect(migration).toContain("content_reports_insert_own_visible_target");
    expect(migration).toContain("content_reports_select_admin");
    expect(migration).toContain("content_reports_update_admin");
    expect(migration).toContain("content_reports_one_active_per_reporter_target_idx");
  });

  it("applies the authoritative database anti-spam quota to reports", () => {
    const migration = read("supabase/migrations/20260829043000_content_moderation.sql");
    expect(migration).toContain("private.enforce_write_rate_limit('content_reports', '20', '86400')");
  });

  it("supports profile, post, project and team reports in the real UI", () => {
    const action = read("lib/moderation/actions.ts");
    const profile = read("components/real/LegacyProfileServerPage.tsx");
    expect(action).toContain('new Set(["profile", "post", "project", "team"])');
    expect(profile).toContain('targetType="profile"');
    expect(profile).toContain('targetType="post"');
    expect(profile).toContain('targetType="project"');
    expect(profile).toContain('targetType="team"');
  });

  it("keeps private-message moderation separate from public content reports", () => {
    const admin = read("app/admin/moderation/page.tsx");
    expect(admin).toContain('from("content_reports")');
    expect(admin).toContain('from("message_reports")');
    expect(admin).toContain('from("direct_messages")');
    expect(admin).toContain('.in("id",messageIds)');
  });
});
