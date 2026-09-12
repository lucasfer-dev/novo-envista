import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("professional product suite", () => {
  it("ships authenticated global search and command palette", () => {
    expect(read("components/product/GlobalSearchCommand.tsx")).toContain("metaKey");
    expect(read("components/product/GlobalSearchCommand.tsx")).toContain("/api/search");
    expect(read("app/api/search/route.ts")).toContain("getClaims");
    expect(read("app/api/search/route.ts")).toContain('from("projects")');
  });

  it("adds activity, insights and team workspace routes", () => {
    const router = read("app/[[...slug]]/page.tsx");
    expect(router).toContain('pathname === "/app/activity"');
    expect(router).toContain('pathname === "/app/insights"');
    expect(router).toContain('pathname === "/app/workspace"');
    expect(read("components/real/TeamWorkspaceServerPage.tsx")).toContain("team_tasks");
  });

  it("adds professional profile, feedback and notification preferences with RLS", () => {
    const migration = read("supabase/migrations/20260912030000_professional_product_suite.sql");
    expect(migration).toContain("create table if not exists public.team_tasks");
    expect(migration).toContain("create table if not exists public.feedback_tickets");
    expect(migration).toContain("create table if not exists public.notification_preferences");
    expect(migration).toContain("enable row level security");
  });

  it("adds public project sharing through a narrow security-definer RPC", () => {
    const migration = read("supabase/migrations/20260912030000_professional_product_suite.sql");
    expect(migration).toContain("get_public_project_share");
    expect(migration).toContain("grant execute on function public.get_public_project_share(text) to anon,authenticated");
    expect(read("app/p/[slug]/page.tsx")).toContain("generateMetadata");
  });

  it("uses branded auth, favicon and persistent session refresh headers", () => {
    expect(read("app/layout.tsx")).toContain("envista-logo.png");
    expect(read("components/auth/Auth.module.css")).toContain("#111a26");
    expect(read("lib/supabase/proxy.ts")).toContain("cacheHeaders");
    expect(read("app/login/page.tsx")).toContain("getClaims");
  });
});
