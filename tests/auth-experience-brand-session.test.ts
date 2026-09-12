import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const layout = readFileSync("app/layout.tsx", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");
const register = readFileSync("app/register/page.tsx", "utf8");
const authShell = readFileSync("components/auth/AuthShell.tsx", "utf8");
const authCss = readFileSync("components/auth/Auth.module.css", "utf8");
const proxy = readFileSync("lib/supabase/proxy.ts", "utf8");

describe("Envista auth experience", () => {
  it("uses the Envista logo as browser-tab icon and brand theme", () => {
    expect(layout).toContain("icons:");
    expect(layout).toContain("/envista-logo.png");
    expect(layout).toContain("themeColor: '#111a26'");
  });

  it("redirects an already authenticated visitor away from login", () => {
    expect(login).toContain("supabase.auth.getClaims()");
    expect(login).toContain("onboarding_completions");
    expect(login).toContain("pathAllowedForRole");
    expect(login).toContain("redirect(");
  });

  it("keeps current Supabase SSR cache headers during session refresh", () => {
    expect(proxy).toContain("setAll(cookiesToSet, cacheHeaders)");
    expect(proxy).toContain("Object.entries(cacheHeaders)");
    expect(proxy).toContain("response.headers.set(key, value)");
  });

  it("uses the product visual language on authentication screens", () => {
    expect(authShell).toContain("brandPanel");
    expect(authShell).toContain("IDEIAS QUE CONTINUAM");
    expect(authCss).toContain("#111a26");
    expect(authCss).toContain("#00bfa6");
    expect(authCss).toContain("#0095ad");
    expect(authCss).not.toContain("background:#fff");
  });

  it("organizes registration into account, identity and security steps", () => {
    expect(register).toContain("Sua conta");
    expect(register).toContain("Verificação de identidade");
    expect(register).toContain("Segurança");
    expect(register).toContain("styles.formSection");
  });
});
