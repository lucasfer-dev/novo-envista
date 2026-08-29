import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260829014500_project_saves_project_index.sql"),
  "utf8",
);

describe("project_saves performance index", () => {
  it("covers the project_id foreign key", () => {
    expect(migration).toContain("create index if not exists project_saves_project_idx");
    expect(migration).toContain("on public.project_saves(project_id)");
  });
});
