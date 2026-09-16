import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260829053000_rpc_security_hardening.sql", "utf8");
const analyticsMigration = readFileSync("supabase/migrations/20260829050000_admin_product_metrics.sql", "utf8");
const analyticsHardeningMigration = readFileSync(
  "supabase/migrations/20260908233000_admin_metrics_security_invoker.sql",
  "utf8",
);
const publicSharePrivacyMigration = readFileSync(
  "supabase/migrations/20260916185654_respect_owner_privacy_in_public_project_share.sql",
  "utf8",
);

describe("rpc security hardening", () => {
  it("runs the message inbox aggregate with caller RLS", () => {
    expect(migration).toContain("public.get_message_threads");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("direct_messages");
    expect(migration).toContain("message_read_state");
  });

  it("does not expose trigger entrypoints to application roles", () => {
    expect(migration).toContain("revoke all on function private.team_after_insert() from public, anon, authenticated");
    expect(migration).toContain("revoke all on function private.team_invitation_transition() from public, anon, authenticated");
  });

  it("keeps the admin metrics authorization gate and removes SECURITY DEFINER exposure", () => {
    expect(analyticsMigration).toContain("admin_required");
    expect(analyticsMigration).toContain("admin_memberships");
    expect(analyticsMigration).not.toContain("message.body");

    expect(analyticsHardeningMigration).toContain(
      "alter function public.admin_product_metrics() security invoker",
    );
    expect(analyticsHardeningMigration).toContain("course_enrollments_select_admin");
    expect(analyticsHardeningMigration).toContain("lesson_progress_select_admin");
    expect(analyticsHardeningMigration).toContain("project_interests_select_admin");
    expect(analyticsHardeningMigration).toContain("project_saves_select_admin");
  });

  it("does not disclose private project owners through the public share RPC", () => {
    expect(publicSharePrivacyMigration).toContain("p.visibility='platform'");
    expect(publicSharePrivacyMigration).toContain("pr.profile_visibility='platform'");
    expect(publicSharePrivacyMigration).toContain("t.visibility='platform'");
    expect(publicSharePrivacyMigration).toContain("else null end");
  });
});
