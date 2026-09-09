import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const nextConfig = readFileSync("next.config.mjs", "utf8");
const retiredDemo = readFileSync("app/auth/demo/page.tsx", "utf8");

describe("beta production hardening", () => {
  it("retires the historical demo URL into the real login", () => {
    expect(retiredDemo).toContain('redirect("/login")');
    expect(retiredDemo).not.toContain("envista_demo");
  });

  it("keeps auth and authenticated surfaces out of search indexes", () => {
    expect(nextConfig).toContain('X-Robots-Tag');
    expect(nextConfig).toContain('noindex, nofollow, noarchive');
    expect(nextConfig).toContain('"/confirm-email"');
    expect(nextConfig).toContain('"/recover-account"');
    expect(nextConfig).toContain('"/auth/:path*"');
    expect(nextConfig).toContain('"/account/:path*"');
    expect(nextConfig).toContain('"/admin/:path*"');
    expect(nextConfig).toContain('"/app/:path*"');
    expect(nextConfig).toContain('"/investor/:path*"');
  });
});
