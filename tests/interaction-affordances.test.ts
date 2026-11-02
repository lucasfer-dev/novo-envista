import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const home = readFileSync("components/product/HomeDashboard.tsx", "utf8");
const dashboard = readFileSync("components/real/LegacyDashboardServerPages.tsx", "utf8");
const explore = readFileSync("components/explore/ExploreView.tsx", "utf8");
const design = readFileSync("app/design-system.css", "utf8");

describe("interaction affordances", () => {
  it("makes dashboard project cards clickable across the whole surface", () => {
    expect(home).toContain('className="panel dashboard-project"');
    expect(home).toContain('aria-label={`Abrir projeto ${project.title}`}');
    expect(home).not.toContain('<article className="panel dashboard-project"');
  });

  it("uses a card-wide target while keeping nested actions usable", () => {
    expect(dashboard).toContain('data-clickable="true"');
    expect(dashboard).toContain('className="card-hit-target"');
    expect(dashboard).toContain('className="actions card-actions"');
    expect(design).toContain(".app-shell .card-hit-target");
    expect(design).toContain(".app-shell .card-actions");
  });

  it("does not give hover elevation to every static project or team card", () => {
    expect(design).not.toContain("\n.app-shell .project-card:hover,");
    expect(design).not.toContain("\n.app-shell .team-card:hover,");
    expect(design).toContain('.app-shell .project-card[data-clickable="true"]:hover');
    expect(design).toContain('.app-shell .team-card[data-clickable="true"]:hover');
  });

  it("visually separates static metadata tags from clickable taxonomy filters", () => {
    expect(design).toContain(".app-shell .chips .chip-link");
    expect(design).toContain("cursor: default;");
    expect(explore).toContain('className="chip-link"');
  });
});
