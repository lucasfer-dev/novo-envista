import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("critical mutation reliability", () => {
  it("verifies project writes before redirecting to success", () => {
    const source = read("lib/projects/actions.ts");

    expect(source).toContain('.insert({');
    expect(source).toContain('.select("id").single()');
    expect(source).toContain('.update({');
    expect(source).toContain('.select("id").maybeSingle()');
    expect(source).toMatch(/delete\(\)[\s\S]*select\("id"\)\.maybeSingle\(\)/);
    expect(source).toContain("if (error || !deleted)");
  });

  it("verifies team and invitation writes before reporting success", () => {
    const source = read("lib/teams/actions.ts");

    expect(source).toContain('.select("id").single()');
    expect(source).toContain("if (error || !invitation)");
    expect(source).toContain("if (error || !removed)");
    expect(source).toContain("if (error || !membership)");
    expect(source).toContain("if (error || !deleted)");
  });
});
