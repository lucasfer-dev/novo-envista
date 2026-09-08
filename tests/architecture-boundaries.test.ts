import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const router = readFileSync("app/[[...slug]]/page.tsx", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");
const backendReadme = readFileSync("backend/README.md", "utf8");
const architecture = readFileSync("docs/ARCHITECTURE.md", "utf8");

describe("product architecture boundaries", () => {
  it("does not expose full demo authentication or demo product routing", () => {
    expect(login).not.toContain("/auth/demo");
    expect(login).not.toContain("participante demo");
    expect(login).not.toContain("investidor demo");
    expect(router).not.toContain("DemoProductPage");
    expect(router).not.toContain("parseDemoRole");
    expect(router).not.toContain("envista_demo");
    expect(existsSync("app/auth/demo/route.ts")).toBe(false);
    expect(existsSync("components/demo/DemoProductPage.tsx")).toBe(false);
  });

  it("does not use the local shell as the authenticated fallback", () => {
    expect(router).toContain("const { role } = await requireProductUser()");
    expect(router).toContain("redirect(homeForRole(role))");
  });

  it("marks the Java service as a non-production prototype", () => {
    expect(backendReadme).toContain("não utilizado em produção");
    expect(backendReadme).toContain("não atende as rotas atuais do produto");
    expect(architecture).toContain("Fonte de verdade");
    expect(architecture).not.toContain("DemoProductPage.tsx");
  });
});
