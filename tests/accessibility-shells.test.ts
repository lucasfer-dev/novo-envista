import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const legacyShell = readFileSync("components/social/LegacySocialShell.tsx", "utf8");
const productShell = readFileSync("components/real/ProductShell.tsx", "utf8");
const adminShell = readFileSync("components/admin/AdminShell.tsx", "utf8");
const accessibility = readFileSync("app/accessibility.css", "utf8");

describe("shared shell accessibility", () => {
  it("offers keyboard users a skip-to-content path", () => {
    for (const source of [legacyShell, productShell, adminShell]) {
      expect(source).toContain('className="a11y-skip-link"');
      expect(source).toContain('href="#main-content"');
      expect(source).toContain('id="main-content"');
      expect(source).toContain("tabIndex={-1}");
    }
  });

  it("exposes mobile navigation state in the interactive product shells", () => {
    expect(legacyShell).toContain('aria-expanded={mobileOpen}');
    expect(legacyShell).toContain('aria-controls="app-navigation"');
    expect(productShell).toContain('aria-expanded={open}');
    expect(productShell).toContain('aria-controls="product-navigation"');
  });

  it("adds visible focus and reduced-motion behavior globally", () => {
    expect(accessibility).toContain("a:focus-visible");
    expect(accessibility).toContain("prefers-reduced-motion: reduce");
    expect(accessibility).toContain(".a11y-skip-link:focus");
  });
});
