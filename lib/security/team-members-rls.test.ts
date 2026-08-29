import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function normalizedMigrations() {
  const directory = join(process.cwd(), "supabase", "migrations");
  return readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(directory, file), "utf8"))
    .join("\n")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

describe("team membership RLS hardening", () => {
  it("leaves authenticated users without direct INSERT access to team_members", () => {
    const sql = normalizedMigrations();
    const broadGrant = sql.lastIndexOf(
      "grant select, insert, update, delete on public.team_members to authenticated",
    );
    const insertRevoke = sql.lastIndexOf(
      "revoke insert on public.team_members from authenticated",
    );

    expect(broadGrant).toBeGreaterThanOrEqual(0);
    expect(insertRevoke).toBeGreaterThan(broadGrant);
  });

  it("removes the direct team_members INSERT policy after it was originally created", () => {
    const sql = normalizedMigrations();
    const policyCreate = sql.lastIndexOf("create policy team_members_insert on public.team_members");
    const policyDrop = sql.lastIndexOf("drop policy if exists team_members_insert on public.team_members");

    expect(policyCreate).toBeGreaterThanOrEqual(0);
    expect(policyDrop).toBeGreaterThan(policyCreate);
  });
});
