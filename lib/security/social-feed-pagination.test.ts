import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("scalable Social feed", () => {
  it("uses one database timeline with server-side paging, search and following mode", () => {
    const source = read("components/social/LegacySocialServerPage.tsx");
    expect(source).toContain('rpc("get_social_feed_refs"');
    expect(source).toContain("result_offset: (page - 1) * PAGE_SIZE");
    expect(source).toContain("result_limit: PAGE_SIZE");
    expect(source).toContain('first(query.mode) === "following"');
    expect(source).toContain("searchQuery");
    expect(source).not.toContain(".limit(140)");
    expect(source).not.toContain(".limit(100)");
  });

  it("keeps mixed timeline ordering and RPC access constrained to authenticated users", () => {
    const migration = read("supabase/migrations/20260829030000_social_feed_pagination.sql");
    expect(migration).toContain("create or replace function public.get_social_feed_refs");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("union all");
    expect(migration).toContain("order by activity_at desc");
    expect(migration).toContain("from anon");
    expect(migration).toContain("to authenticated");
  });
});
