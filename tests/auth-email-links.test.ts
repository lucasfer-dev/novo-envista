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
const updatePasswordPage = readFileSync("app/update-password/page.tsx", "utf8");
const callback = readFileSync("app/auth/callback/route.ts", "utf8");
const confirm = readFileSync("app/auth/confirm/route.ts", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const serverClient = readFileSync("lib/supabase/server.ts", "utf8");
const recoveryIntent = readFileSync("lib/auth/recovery-intent.ts", "utf8");
const runbook = readFileSync("docs/operations/AUTH_EMAILS.md", "utf8");

describe("auth email links", () => {
  it("never emits localhost from a Vercel production environment", () => {
    expect(resolveSiteUrl({ VERCEL: "1", VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }))
      .toBe(ENVISTA_PRODUCTION_FALLBACK_URL);
  });

  it("prefers the configured official production domain", () => {
    expect(resolveSiteUrl({
      VERCEL: "1",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://useenvista.com.br/",
      VERCEL_PROJECT_PRODUCTION_URL: "envista-novo.vercel.app",
    })).toBe("https://useenvista.com.br");
  });

  it("uses the stable Vercel alias when system URL variables are missing", () => {
    expect(resolveSiteUrl({ VERCEL: "1", VERCEL_ENV: "production" }))
      .toBe("https://envista-novo.vercel.app");
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

  it("consumes confirmation and recovery credentials only after explicit POST actions", () => {
    expect(confirmPage).toContain("confirmEmailAction");
    expect(recoveryPage).toContain("beginRecoveryAction");
    expect(confirmPage).toContain('name="type"');
    expect(recoveryPage).toContain('name="type"');
    expect(emailActions).toContain("verifyOtp");
    expect(emailActions).toContain("exchangeCodeForSession");
    expect(emailActions).toContain("invalid-type");
  });

  it("requires TokenHash type to match the expected flow", () => {
    expect(emailActions).toContain('tokenHash && type !== expected');
    expect(recoveryPage).toContain('type === "recovery"');
    expect(confirmPage).toContain('type === "email"');
  });

  it("fails closed when authentication cookie writes fail", () => {
    expect(serverClient).toContain("requireCookieWrites");
    expect(serverClient).toContain("auth.cookies.write_failed");
    expect(serverClient).toContain("throw error");
    expect(emailActions).toContain("createClient({ requireCookieWrites: true })");
  });

  it("does not re-check claims immediately after consuming a one-time token", () => {
    const establishSession = emailActions.slice(
      emailActions.indexOf("async function establishSession"),
      emailActions.indexOf("export async function confirmEmailAction"),
    );
    expect(establishSession).toContain("result.data.session?.user?.id");
    expect(establishSession).not.toContain("getClaims");
  });

  it("binds password updates to a short-lived signed recovery intent", () => {
    expect(recoveryIntent).toContain("AUTH_RECOVERY_COOKIE_SECRET");
    expect(recoveryIntent).toContain("createHmac");
    expect(recoveryIntent).toContain("httpOnly: true");
    expect(recoveryIntent).toContain('sameSite: "lax"');
    expect(emailActions).toContain("hasValidRecoveryIntent");
    expect(emailActions).toContain("updateRecoveryPasswordAction");
    expect(updatePasswordPage).toContain("hasValidRecoveryIntent");
    expect(updatePasswordPage).toContain("updateRecoveryPasswordAction");
  });

  it("revokes sessions after a successful password reset", () => {
    expect(emailActions).toContain('signOut({ scope: "global" })');
    expect(emailActions).toContain('signOut({ scope: "local" })');
    expect(emailActions).toContain('/login?status=password-updated');
  });

  it("keeps legacy confirmation and recovery GET callbacks scanner-safe", () => {
    expect(callback).toContain("cannot consume one-time credentials");
    expect(callback).toContain('target.pathname = flow === "recovery" ? "/recover-account" : "/confirm-email"');
    expect(confirm).toContain("must never be consumed by GET");
    expect(confirm).toContain('type === "recovery" ? "/recover-account" : "/confirm-email"');
  });

  it("suppresses referrers, caches and indexing on credential-bearing auth routes", () => {
    expect(proxy).toContain('response.headers.set("Referrer-Policy", "no-referrer")');
    expect(proxy).toContain('response.headers.set("Cache-Control", "private, no-store, max-age=0")');
    expect(proxy).toContain('response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")');
    expect(proxy).toContain('pathname === "/recover-account"');
    expect(proxy).toContain('pathname === "/confirm-email"');
  });

  it("shows a dedicated success screen after email verification", () => {
    expect(emailActions).toContain('/confirm-email?status=confirmed');
    expect(confirmPage).toContain('params.status === "confirmed"');
    expect(confirmPage).toContain("E-mail confirmado");
  });

  it("accepts old PKCE codes while token-hash templates remain primary", () => {
    expect(confirmPage).toContain("params.code");
    expect(recoveryPage).toContain("params.code");
    expect(emailActions).toContain("exchangeCodeForSession");
    expect(runbook).toContain("Compatibilidade com e-mails antigos");
  });

  it("documents token-hash templates that point directly at Envista", () => {
    expect(runbook).toContain("{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email");
    expect(runbook).toContain("{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery");
    expect(runbook).toContain("/confirm-email");
    expect(runbook).toContain("/recover-account");
  });
});
