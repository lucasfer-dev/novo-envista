import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("product role boundaries", () => {
  it("requires participant sessions for project and team write actions", () => {
    const projectActions = read("lib/projects/actions.ts");
    const teamActions = read("lib/teams/actions.ts");

    expect(projectActions).toContain('requireProductUser("participant")');
    expect(teamActions).toContain('requireProductUser("participant")');
    expect(teamActions).toContain('.eq("role", "participant")');
  });

  it("keeps owned-content destinations out of investor navigation", () => {
    const shell = read("components/social/LegacySocialShell.tsx");
    const investorNav = shell.split("const investorNav = [")[1]?.split("] as const;")[0] ?? "";

    expect(investorNav).not.toContain('/investor/projects"');
    expect(investorNav).not.toContain('/investor/teams"');
    expect(investorNav).toContain('/investor/explore"');
    expect(investorNav).toContain('/investor/saved"');
  });

  it("enforces participant ownership in database policies", () => {
    const migration = read("supabase/migrations/20260829013000_product_role_boundaries.sql");

    expect(migration).toContain("private.is_participant()");
    expect(migration).toContain("private.is_participant(invitee_id)");
    expect(migration).toMatch(/create policy teams_insert[\s\S]*private\.is_participant\(\)/);
    expect(migration).toMatch(/create policy projects_insert[\s\S]*private\.is_participant\(\)/);
    expect(migration).toMatch(/create policy projects_update[\s\S]*private\.is_participant\(\)/);
    expect(migration).toMatch(/create policy projects_delete[\s\S]*private\.is_participant\(\)/);
  });
});
