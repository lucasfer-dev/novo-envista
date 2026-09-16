import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const router = readFileSync("app/[...slug]/page.tsx", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const profile = readFileSync("app/account/profile/page.tsx", "utf8");
const schools = readFileSync("app/schools/page.tsx", "utf8");
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

  it("keeps /app only as an internal compatibility route", () => {
    expect(proxy).toContain('pathname === "/app" || pathname.startsWith("/app/")');
    expect(proxy).toContain('NextResponse.redirect(target, 308)');
    expect(proxy).toContain('target.pathname = pathname === "/home" ? "/app" : `/app${pathname}`');
    expect(proxy).toContain("NextResponse.rewrite(target");
  });

  it("does not serve the legacy demo shell for unknown public routes", () => {
    expect(router).toContain("notFound()");
    expect(router).not.toContain('import EnvistaApp from "@/components/EnvistaApp"');
    expect(existsSync("app/about/page.tsx")).toBe(true);
    expect(existsSync("app/schools/page.tsx")).toBe(true);
    expect(schools).not.toContain("formulário do MVP é apenas demonstrativo");
    expect(schools).not.toContain("Interesse registrado no MVP");
  });

  it("logs profile load failures without putting account identifiers in the event", () => {
    expect(profile).toContain('logServerEvent("error", "account_profile_load_failed", loadError)');
    expect(profile).toContain('source: "profiles"');
    expect(profile).toContain('source: "account_compliance"');
    expect(profile).toContain('source: "onboarding_completions"');
    expect(profile).not.toContain('logServerEvent("error", "account_profile_load_failed", { userId');
  });

  it("marks the Java service as a non-production prototype", () => {
    expect(backendReadme).toContain("não utilizado em produção");
    expect(backendReadme).toContain("não atende as rotas atuais do produto");
    expect(architecture).toContain("Fonte de verdade");
    expect(architecture).not.toContain("DemoProductPage.tsx");
  });
});
