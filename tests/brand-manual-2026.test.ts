import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("app/brand-manual-2026.css","utf8");
const layout = readFileSync("app/layout.tsx","utf8");
const social = readFileSync("components/social/LegacySocialFeed.tsx","utf8");
const landing = readFileSync("components/public/PublicLandingV3Server.tsx","utf8");
const logo = readFileSync("public/brand/envista-symbol-gradient.svg","utf8");

describe("Manual de identidade visual Envista — 2026", () => {
  it("keeps the four exact colours from the official manual", () => {
    for (const hex of ["#0082a3","#00a599","#22b173","#0f1923"]) {
      expect(css.toLowerCase()).toContain(hex);
    }
  });
  it("loads one final design layer and Montserrat across page families", () => {
    expect(layout).toContain("import './brand-manual-2026.css'");
    expect(layout).toContain("fonts.googleapis.com/css2?family=Montserrat");
    expect(css).toContain(".app-shell[data-envista-product-shell]");
    expect(css).toContain(".envista-auth-page");
    expect(css).toContain("[data-envista-public-shell]");
    expect(css).toContain("[data-envista-admin-shell]");
  });
  it("preserves the approved E-eye mark with an inverted upper-eye gradient", () => {
    expect(logo).toContain("envista-eye-top");
    expect(logo).toContain("envista-body");
    expect(logo).toContain("#22b173");
    expect(logo).toContain("#0082a3");
  });
  it("only uses manual artwork in contextual surfaces", () => {
    expect(css).toContain("manual-wave-blue.svg");
    expect(css).toContain("manual-wave-green.svg");
    expect(css).not.toContain('url("/brand/envista-earth-horizon.svg")');
    expect(social).not.toContain('styles.heroGlobe');
  });
  it("keeps real project links and does not display fictitious samples on the public home", () => {
    expect(landing).toContain("projects.map(project => <ProjectCard");
    expect(landing).toContain('href={`/p/${encodeURIComponent(project.slug)}`}');
    expect(landing).not.toContain("sampleProjects");
    expect(landing).not.toContain("Exemplo ilustrativo");
  });
});
