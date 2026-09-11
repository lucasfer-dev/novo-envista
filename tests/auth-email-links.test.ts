import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ENVISTA_PRODUCTION_FALLBACK_URL,
  resolveSiteUrl,
} from "../lib/auth/site-url";

const actions = readFileSync("app/auth/actions.ts", "utf8");
const emailActions = readFileSync("app/auth/email-actions.ts", "utf8");
const confirmPage = readFileSync("app/confirm-email/page.tsx", "utf8");
const recoveryPage = readFileSync("app/recover-account/page.tsx", "utf8");
const callback = readFileSync("app/auth/callback/route.ts", "utf8");
const confirm = readFileSync("app/auth/confirm/route.ts", "utf8");
const runbook = readFileSync("docs/operations/AUTH_EMAILS.md", "utf8");

describe("auth email links", () => {
  it("never emits localhost from a Vercel production environment", () => {
    expect(
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toBe(ENVISTA_PRODUCTION_FALLBACK_URL);
  });

  it("prefers the configured official production domain", () => {
    expect(
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://useenvista.com/",
        VERCEL_PROJECT_PRODUCTION_URL: "envista-novo.vercel.app",
      }),
    ).toBe("https://useenvista.com");
  });

  it("uses the stable Vercel alias when system URL variables are missing", () => {
    expect(
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
      }),
    ).toBe("https://envista-novo.vercel.app");
  });

  it("keeps localhost available only for local development", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });

  it("routes new signup and recovery emails to Envista-owned pages", () => {
    expect(actions).toContain("/confirm-email");
    expect(actions).toContain("/recover-account");
    expect(actions).not.toContain("/auth/callback?next=/onboarding");
    expect(actions).not.toContain("/auth/callback?next=/update-password");
  });

  it("consumes email tokens only after an explicit Envista action", () => {
    expect(confirmPage).toContain("confirmEmailAction");
    expect(confirmPage).toContain("Confirmar meu e-mail");
    expect(recoveryPage).toContain("beginRecoveryAction");
    expect(recoveryPage).toContain("Continuar para criar nova senha");
    expect(emailActions).toContain('flow === "recovery" ? "recovery" : "email"');
    expect(emailActions).toContain("verifyOtp");
  });

  it("shows a dedicated success screen after email verification", () => {
    expect(emailActions).toContain('/confirm-email?status=confirmed');
    expect(confirmPage).toContain('params.status === "confirmed"');
    expect(confirmPage).toContain("E-mail confirmado");
    expect(confirmPage).toContain("Continuar no Envista");
  });

  it("accepts PKCE codes on the new pages while old emails age out", () => {
    expect(confirmPage).toContain("params.code");
    expect(recoveryPage).toContain("params.code");
    expect(emailActions).toContain("exchangeCodeForSession");
    expect(runbook).toContain("Compatibilidade com e-mails antigos");
  });

  it("documents token-hash templates that point directly at Envista", () => {
    expect(runbook).toContain("{{ .RedirectTo }}?token_hash={{ .TokenHash }}");
    expect(runbook).toContain("/confirm-email");
    expect(runbook).toContain("/recover-account");
  });

  it("keeps legacy PKCE and token-hash callbacks as compatibility fallbacks", () => {
    expect(callback).toContain("exchangeCodeForSession");
    expect(callback).toContain("verifyOtp");
    expect(callback).toContain("token_hash");
    expect(callback).toContain("recovery");
    expect(confirm).toContain('type === "recovery"');
    expect(confirm).toContain("/update-password");
  });
});
