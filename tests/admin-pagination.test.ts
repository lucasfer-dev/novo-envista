import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const files = [
  "app/admin/users/page.tsx",
  "app/admin/teams/page.tsx",
  "app/admin/projects/page.tsx",
  "app/admin/courses/page.tsx",
  "app/admin/privacy/page.tsx",
  "app/admin/moderation/page.tsx",
];

describe("admin list pagination", () => {
  it("uses database ranges instead of large fixed limits", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain(".range(");
      expect(source).not.toMatch(/\.limit\((?:100|200|300)\)/);
    }
  });

  it("requests exact counts for pageable collections", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/count:\s*"exact"/);
    }
  });

  it("does not scan all team memberships for the team registry", () => {
    const source = readFileSync("app/admin/teams/page.tsx", "utf8");
    expect(source).toContain('.in("team_id", teamIds)');
  });

  it("keeps moderation queues independently pageable", () => {
    const source = readFileSync("app/admin/moderation/page.tsx", "utf8");
    expect(source).toContain('pageParam="content_page"');
    expect(source).toContain('pageParam="message_page"');
  });
});
