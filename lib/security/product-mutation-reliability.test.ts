import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("product mutation reliability", () => {
  it("checks social write errors", () => {
    const source = read("lib/social-real/actions.ts");
    expect(source).toContain("lookupError");
    expect(source).toContain("if (error || !created)");
    expect(source).toContain("if (error || !deleted)");
  });

  it("checks message, block and report writes", () => {
    const source = read("lib/messages/actions.ts");
    expect(source).toContain("if (error || !message)");
    expect(source).toContain("if (error || !block)");
    expect(source).toContain('error.code !== "23505"');
  });

  it("checks course, investor and notification write failures", () => {
    const courses = read("lib/courses/actions.ts");
    const investor = read("lib/projects/investor-actions.ts");
    const notifications = read("lib/notifications/actions.ts");

    expect(courses).toContain("if (error && error.code !== \"23505\")");
    expect(investor).toContain("if (error || !interest)");
    expect(notifications).toContain('redirect(`${base}?error=read`)');
    expect(notifications).toContain('redirect(`${base}?error=delete`)');
  });
});
