import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("scalable Explore search", () => {
  it("uses database RPC pagination for real accounts", () => {
    const source = read("components/explore/LegacyExploreServerPage.tsx");
    expect(source).toContain('rpc("search_explore_projects"');
    expect(source).toContain('rpc("search_explore_teams"');
    expect(source).toContain('rpc("search_explore_profiles"');
    expect(source).not.toContain('.limit(100)');
    expect(source).toContain("projects_page");
    expect(source).toContain("teams_page");
    expect(source).toContain("people_page");
  });

  it("adds indexed text search and authenticated RPC permissions", () => {
    const migration = read("supabase/migrations/20260829023000_explore_server_search.sql");
    expect(migration).toContain("create extension if not exists pg_trgm");
    expect(migration).toContain("projects_explore_search_trgm_idx");
    expect(migration).toContain("teams_explore_search_trgm_idx");
    expect(migration).toContain("profiles_explore_search_trgm_idx");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("to authenticated");
  });
});
