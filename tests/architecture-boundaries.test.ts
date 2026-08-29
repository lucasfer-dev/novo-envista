import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const router = readFileSync("app/[[...slug]]/page.tsx", "utf8");
const demo = readFileSync("components/demo/DemoProductPage.tsx", "utf8");
const backendReadme = readFileSync("backend/README.md", "utf8");
const architecture = readFileSync("docs/ARCHITECTURE.md", "utf8");

describe("product architecture boundaries", () => {
  it("keeps demo identities and demo routing outside the real route resolver", () => {
    expect(router).toContain("DemoProductPage");
    expect(router).toContain("parseDemoRole");
    expect(router).not.toContain("demoParticipant");
    expect(router).not.toContain("demoInvestor");
    expect(router).not.toContain("authenticatedProfile={demo");
    expect(demo).toContain('id: "demo-participant"');
    expect(demo).toContain('id: "demo-investor"');
  });

  it("does not use the local demo shell as the authenticated fallback", () => {
    expect(router).toContain("const { role } = await requireProductUser()");
    expect(router).toContain("redirect(homeForRole(role))");
  });

  it("marks the Java service as a non-production prototype", () => {
    expect(backendReadme).toContain("não utilizado em produção");
    expect(backendReadme).toContain("não atende as rotas atuais do produto");
    expect(architecture).toContain("Fonte de verdade");
    expect(architecture).toContain("DemoProductPage.tsx");
  });
});
