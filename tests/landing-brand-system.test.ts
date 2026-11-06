import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("components/public/PublicLandingServer.tsx", "utf8");
const style = [
  "app/landing-brand-art-direction.css",
  "app/landing-brand-sections.css",
  "app/landing-brand-accessibility.css",
].map((name) => readFileSync(name, "utf8")).join("\n");
const layout = readFileSync("app/layout.tsx", "utf8");

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Envista 2026 official visual identity and UX laws", () => {
  it("uses all official materials in distinct, deliberate roles", () => {
    expect(style).toContain("#0086a7");
    expect(style).toContain("#00a99d");
    expect(style).toContain("#22b573");
    expect(style).toContain("#0f1923");
    expect(style).toContain("envista-pattern-original.png");
    expect(style).toContain("envista-texture-original.png");
    expect(style).toContain("envista-symbol-white.svg");
    expect(page).toContain("ev-projectMonogram");
    expect(page).toContain("ev-brandDescriptor");
    expect(page).toContain("ev-manifestoSeal");
  });

  it("keeps decorative identity out of screen reader navigation", () => {
    expect(page).toContain('className="ev-heroVisualAxis" aria-hidden="true"');
    expect(page).toContain('className="ev-manifestoSeal" aria-hidden="true"');
    expect(page).toContain('tabIndex={-1}');
    expect(page).toContain('aria-label="Menu de navegação"');
  });

  it("applies brand rules after earlier landing style layers", () => {
    for (const file of ["landing-brand-art-direction.css", "landing-brand-sections.css", "landing-brand-accessibility.css"]) {
      expect(layout).toContain(file);
    }
    expect(layout.indexOf("landing-brand-accessibility.css")).toBeGreaterThan(layout.indexOf("landing-brand-sections.css"));
  });

  it("meets AA small-text contrast against the darkest gradient stop", () => {
    // The blue stop is the darkest of the 3 official gradient stops.
    expect(contrast("#000b0f", "#0086a7")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#000b0f", "#00a99d")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#000b0f", "#22b573")).toBeGreaterThanOrEqual(4.5);
    expect(style).toContain("color:#000b0f!important");
  });

  it("preserves a focus affordance, touch targets and motion preferences", () => {
    expect(style).toContain("focus-visible");
    expect(style).toContain("min-height:48px");
    expect(style).toContain("prefers-reduced-motion:reduce");
    expect(style).toContain("scroll-margin-top");
  });
});
