import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const dashboard = readFileSync("components/real/LegacyDashboardServerPages.tsx", "utf8");

describe("first-run product guidance", () => {
  it("explains privacy defaults and username requirements during onboarding", () => {
    expect(onboarding).toContain("Privacidade primeiro");
    expect(onboarding).toContain('autoComplete="username"');
    expect(onboarding).toContain('aria-describedby="username-help"');
    expect(onboarding).toContain("Salvar e entrar no Envista");
  });

  it("gives participant accounts actionable first steps", () => {
    expect(dashboard).toContain('label: "Crie seu primeiro projeto"');
    expect(dashboard).toContain('label: "Entre ou crie uma equipe"');
    expect(dashboard).toContain('label: "Comece um curso"');
    expect(dashboard).toContain('href="/app/teams/new"');
  });

  it("gives investor accounts actionable first steps", () => {
    expect(dashboard).toContain('label: "Salve um projeto"');
    expect(dashboard).toContain('label: "Acompanhe alguém"');
    expect(dashboard).toContain('label: "Demonstre interesse"');
    expect(dashboard).toContain('title="Comece por aqui"');
  });
});
