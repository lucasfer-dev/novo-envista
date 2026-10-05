import { describe, expect, it } from "vitest";
import { normalizeProductPath, productNavigation, productNavActive } from "./product-navigation";

describe("project network navigation", () => {
  it("keeps five primary destinations for both roles", () => {
    expect(productNavigation("participant")).toHaveLength(5);
    expect(productNavigation("investor")).toHaveLength(5);
  });
  it("keeps home and social activity in one navigation destination", () => {
    expect(productNavActive("/app/social", "/home")).toBe(true);
    expect(productNavActive("/home", "/home")).toBe(true);
    expect(productNavActive("/investor/social", "/investor")).toBe(true);
    expect(productNavActive("/investor/messages", "/investor")).toBe(false);
  });
  it("groups contextual routes without prefix collisions", () => {
    for (const route of ["/app/projects/aqua/cockpit", "/teams/orion", "/workspace", "/insights", "/interests"]) {
      expect(productNavActive(route, "/app/projects")).toBe(true);
    }
    expect(productNavActive("/calendar", "/competitions")).toBe(true);
    expect(productNavActive("/integrations/github", "/integrations/github")).toBe(true);
    expect(productNavActive("/projectsmanship", "/app/projects")).toBe(false);
    expect(normalizeProductPath("/app/explore")).toBe("/explore");
  });
});
