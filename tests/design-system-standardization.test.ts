import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const designSystem = readFileSync("app/design-system.css", "utf8");
const brandIdentity = readFileSync("app/brand-identity.css", "utf8");
const productShell = readFileSync("components/social/LegacySocialShell.tsx", "utf8");
const accountShell = readFileSync("components/account/AccountProductShell.tsx", "utf8");
const publicSurfaces = [
  "components/public/PublicLandingServer.tsx",
  "app/projects/page.tsx",
  "app/p/[slug]/page.tsx",
  "app/schools/page.tsx",
].map((path) => readFileSync(path, "utf8"));

const accountPages = [
  "app/account/settings/page.tsx",
  "app/account/security/page.tsx",
  "app/account/professional/page.tsx",
  "app/account/privacy/page.tsx",
  "app/account/feedback/page.tsx",
].map((path) => readFileSync(path, "utf8"));

describe("Envista visual identity standardization", () => {
  it("keeps the official palette as product design tokens", () => {
    expect(designSystem).toContain("--ev-brand-blue: #0086a7");
    expect(designSystem).toContain("--ev-brand-teal: #00a99d");
    expect(designSystem).toContain("--ev-brand-green: #22b573");
    expect(designSystem).toContain("--ev-brand-ink: #0f1923");
    expect(designSystem).toContain("--ev-brand-gradient:");
  });

  it("marks the legacy authenticated shell as the canonical product shell", () => {
    expect(productShell).toContain("data-envista-product-shell");
    expect(brandIdentity).toContain('[class*="__primary"]');
    expect(brandIdentity).toContain('[class*="__secondary"]');
  });

  it("uses the brand gradient as the canonical standard action button", () => {
    expect(brandIdentity).toContain("--ev-primary-bg: var(--envista-gradient)");
    expect(brandIdentity).toContain('[class*="__ghost"]');
    expect(brandIdentity).toContain('[class*="__headerCta"]');
    expect(brandIdentity).toContain("[data-envista-public-shell]");
    for (const page of publicSurfaces) expect(page).toContain("data-envista-public-shell");
  });

  it("keeps account management inside the authenticated product experience", () => {
    expect(accountShell).toContain("LegacySocialShell");
    expect(accountShell).toContain("account-page-panel");
    for (const page of accountPages) {
      expect(page).toContain("AccountProductShell");
      expect(page).not.toContain("<AuthShell");
    }
  });

  it("keeps authentication branding separate from account management", () => {
    expect(brandIdentity).toContain(".envista-auth-page");
    expect(brandIdentity).toContain("envista-texture-green.svg");
    expect(brandIdentity).toContain("Account workspace: account management belongs to the authenticated product");
  });
});
