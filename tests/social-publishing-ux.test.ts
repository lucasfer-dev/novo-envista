import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actionSource = readFileSync("lib/social-real/actions.ts", "utf8");
const feedSource = readFileSync("components/social/LegacySocialFeed.tsx", "utf8");
const onboardingSource = readFileSync("app/onboarding/page.tsx", "utf8");
const profileSource = readFileSync("app/account/profile/page.tsx", "utf8");

describe("social publishing privacy contract", () => {
  it("defaults the composer to private instead of offering an RLS-incompatible public post first", () => {
    expect(feedSource).toContain('name="visibility" defaultValue="private"');
    expect(feedSource.indexOf('<option value="private">Privado</option>')).toBeLessThan(
      feedSource.indexOf('<option value="platform">Público no Envista</option>'),
    );
  });

  it("preflights public personal posts against profile visibility", () => {
    expect(actionSource).toContain('.select("profile_visibility")');
    expect(actionSource).toContain('profile?.profile_visibility !== "platform"');
    expect(actionSource).toContain('"profile-private"');
  });

  it("preflights public team posts against team visibility", () => {
    expect(actionSource).toContain('.select("visibility")');
    expect(actionSource).toContain('team?.visibility !== "platform"');
    expect(actionSource).toContain('"team-private"');
  });

  it("shows actionable feedback instead of a generic failure for privacy conflicts", () => {
    expect(feedSource).toContain('Seu perfil está privado. Publique como privado');
    expect(feedSource).toContain('Essa equipe está privada. Publique como privado');
  });
});

describe("username pattern compatibility", () => {
  it("escapes the literal hyphen for HTML pattern unicode-sets mode", () => {
    const safePattern = "[A-Za-z0-9][A-Za-z0-9._\\\\-]{2,31}";
    expect(onboardingSource).toContain(safePattern);
    expect(profileSource).toContain(safePattern);
    expect(onboardingSource).not.toContain('[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}');
    expect(profileSource).not.toContain('[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}');
  });
});
