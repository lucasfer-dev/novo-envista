import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260829053000_rpc_security_hardening.sql", "utf8");
const analyticsMigration = readFileSync("supabase/migrations/20260829050000_admin_product_metrics.sql", "utf8");

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

  it("keeps the admin metrics definer explicitly authorization-gated", () => {
    expect(analyticsMigration).toContain("admin_required");
    expect(analyticsMigration).toContain("admin_memberships");
    expect(analyticsMigration).not.toContain("message.body");
  });
});
