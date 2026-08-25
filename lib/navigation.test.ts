import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./navigation";

describe("estado ativo da navegacao", () => {
  it("mantem as homes como correspondencias exatas", () => {
    expect(isNavItemActive("/app", "/app")).toBe(true);
    expect(isNavItemActive("/app/projects", "/app")).toBe(false);
    expect(isNavItemActive("/investor", "/investor")).toBe(true);
    expect(isNavItemActive("/investor/saved", "/investor")).toBe(false);
  });

  it("ativa destinos participantes em suas rotas filhas", () => {
    expect(isNavItemActive("/app/projects/aqua", "/app/projects")).toBe(true);
    expect(isNavItemActive("/app/teams/equipe-x", "/app/teams")).toBe(true);
    expect(isNavItemActive("/app/competitions/hackathon-x", "/app/competitions")).toBe(true);
    expect(isNavItemActive("/app/learn/curso-x/lesson/aula-y", "/app/learn")).toBe(true);
  });

  it("ativa destinos investidores em suas rotas filhas sem confundir prefixos", () => {
    expect(isNavItemActive("/investor/projects/aqua", "/investor/projects")).toBe(true);
    expect(isNavItemActive("/investor/saved", "/investor/saved")).toBe(true);
    expect(isNavItemActive("/app/projectsmanship", "/app/projects")).toBe(false);
  });
});
