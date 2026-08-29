import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const release = readFileSync("docs/operations/RELEASE.md", "utf8");
const backup = readFileSync("docs/operations/BACKUP_RECOVERY.md", "utf8");
const incident = readFileSync("docs/operations/INCIDENT_RESPONSE.md", "utf8");

describe("production operations runbooks", () => {
  it("keeps the current manual release blockers visible", () => {
    expect(release).toContain("leaked password protection");
    expect(release).toContain("Bloqueador de lançamento público");
    expect(release).toContain("versões internas de teste");
  });

  it("documents that database recovery does not restore Storage bytes", () => {
    expect(backup).toContain("backup de banco não é backup de Storage");
    expect(backup).toContain("não restauram os objetos/bytes");
    expect(backup).toContain("avatars");
    expect(backup).toContain("project-assets");
  });

  it("has explicit response paths for authorization and credential incidents", () => {
    expect(incident).toContain("SEV-1");
    expect(incident).toContain("Autorização/RLS");
    expect(incident).toContain("revogue/rotacione");
  });
});
