import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ENVISTA_PRODUCTION_FALLBACK_URL,
  resolveSiteUrl,
} from "../lib/auth/site-url";

const actions = readFileSync("app/auth/actions.ts", "utf8");
const callback = readFileSync("app/auth/callback/route.ts", "utf8");
const confirm = readFileSync("app/auth/confirm/route.ts", "utf8");

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

  it("uses explicit destinations for signup and password recovery", () => {
    expect(actions).toContain("/auth/callback?next=/onboarding");
    expect(actions).toContain("/auth/callback?next=/update-password");
  });

  it("supports PKCE and token-hash callbacks", () => {
    expect(callback).toContain("exchangeCodeForSession");
    expect(callback).toContain("verifyOtp");
    expect(callback).toContain("token_hash");
    expect(callback).toContain("recovery");
    expect(confirm).toContain('type === "recovery"');
    expect(confirm).toContain("/update-password");
  });
});
