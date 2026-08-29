import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260829050000_admin_product_metrics.sql", "utf8");
const analyticsPage = readFileSync("app/admin/analytics/page.tsx", "utf8");
const adminShell = readFileSync("components/admin/AdminShell.tsx", "utf8");

describe("admin operational analytics", () => {
  it("keeps the aggregate RPC admin-only", () => {
    expect(migration).toContain("admin_product_metrics");
    expect(migration).toContain("admin_required");
    expect(migration).toContain("revoke all on function public.admin_product_metrics() from public, anon");
  });

  it("aggregates product activation without user-level click tracking", () => {
    expect(migration).toContain("project_interests");
    expect(migration).toContain("course_enrollments");
    expect(migration).toContain("content_reports");
    expect(analyticsPage).toContain('supabase.rpc("admin_product_metrics")');
    expect(analyticsPage).not.toContain("analytics-events");
  });

  it("exposes analytics and projects in the admin navigation", () => {
    expect(adminShell).toContain('/admin/analytics');
    expect(adminShell).toContain('/admin/projects');
  });
});
