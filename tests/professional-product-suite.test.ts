import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("professional product suite", () => {
  it("ships authenticated global search and complete command palette keyboard UX", () => {
    const command = read("components/product/GlobalSearchCommand.tsx");
    expect(command).toContain("metaKey");
    expect(command).toContain("/api/search");
    expect(command).toContain('event.key === "ArrowDown"');
    expect(command).toContain('event.key === "ArrowUp"');
    expect(command).toContain('event.key === "Enter"');
    expect(command).not.toContain("no futuro");
    expect(read("app/api/search/route.ts")).toContain("getClaims");
    expect(read("app/api/search/route.ts")).toContain('from("projects")');
  });

  it("adds activity, insights and team workspace routes", () => {
    const router = read("app/[...slug]/page.tsx");
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
    const publicProject = read("app/p/[slug]/page.tsx");
    expect(publicProject).toContain("generateMetadata");
    expect(publicProject).toContain("opengraph-image");
  });

  it("uses the current Envista visual identity, favicon and persistent session refresh headers", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain("envista-logo.png");
    expect(layout).toContain("design-system.css");
    expect(layout).not.toContain("product-polish.css");
    expect(layout).not.toContain("professional-polish.css");
    expect(read("components/auth/Auth.module.css")).toContain("#0b141f");
    expect(read("lib/supabase/proxy.ts")).toContain("cacheHeaders");
    expect(read("app/login/page.tsx")).toContain("getClaims");
  });
});
