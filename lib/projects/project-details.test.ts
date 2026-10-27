import { describe, expect, it } from "vitest";
import { normalizeProjectDetails, readProjectDetails } from "./project-details";

describe("metadados do projeto", () => {
  it("aceita apenas campos conhecidos e normaliza listas e tipos", () => {
    const data = new FormData();
    data.set("project_type", "startup");
    data.set("main_goal", "  Validar uma hipótese  ");
    data.set("technologies", "React, TypeScript, React, , Python");
    data.set("seeking_investment", "on");
    data.set("owner_user_id", "tentativa-de-injecao");
    const result = readProjectDetails(data);
    expect(result.project_type).toBe("startup");
    expect(result.main_goal).toBe("Validar uma hipótese");
    expect(result.technologies).toEqual(["React", "TypeScript", "Python"]);
    expect(result.seeking_investment).toBe(true);
    expect(Object.keys(result)).not.toContain("owner_user_id");
  });

  it("limita tamanho de campos e descarta tipos desconhecidos", () => {
    const data = new FormData();
    data.set("project_type", "fake");
    data.set("validation", "x".repeat(6000));
    data.set("technologies", Array.from({ length: 30 }, (_, i) => "T" + i).join(","));
    const result = readProjectDetails(data);
    expect(result.project_type).toBe("");
    expect(result.validation).toHaveLength(4000);
    expect(result.technologies).toHaveLength(12);
    expect(result.seeking_investment).toBe(false);
  });

  it("interpreta projetos antigos sem details e dados inválidos", () => {
    expect(normalizeProjectDetails(null).technologies).toEqual([]);
    expect(normalizeProjectDetails(undefined).seeking_investment).toBe(false);
    expect(normalizeProjectDetails({ technologies: [42, "React", {}, "Node"], seeking_investment: "true" })).toMatchObject({
      technologies: ["React", "Node"],
      seeking_investment: false,
    });
  });

  it("preserva detalhes opcionais após leitura", () => {
    const data = new FormData();
    data.set("target_audience", "Estudantes");
    data.set("competitive_edge", "Simplicidade");
    data.set("next_goals", "Publicar o MVP");
    expect(normalizeProjectDetails(readProjectDetails(data))).toMatchObject({
      target_audience: "Estudantes",
      competitive_edge: "Simplicidade",
      next_goals: "Publicar o MVP",
    });
  });
});
