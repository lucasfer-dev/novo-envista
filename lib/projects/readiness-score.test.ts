import { describe, expect, it } from "vitest";
import { calculateProjectReadiness } from "./readiness-score";

describe("calculateProjectReadiness", () => {
  it("keeps an empty project in the initial band and returns actionable gaps", () => {
    const result = calculateProjectReadiness({});
    expect(result.score).toBe(0);
    expect(result.level).toBe("inicial");
    expect(result.missing).toContain("Problema bem definido");
    expect(result.missing).toContain("Evidência externa (site, demo, código ou design)");
  });

  it("scores a complete project as ready to present", () => {
    const result = calculateProjectReadiness({
      short_description: "Uma plataforma para conectar projetos estudantis a oportunidades reais.",
      problem: "Projetos estudantis relevantes ficam dispersos e têm dificuldade de chegar a pessoas capazes de apoiar sua evolução.",
      solution: "Centralizamos portfólio, equipe, aprendizado, evidências e descoberta em uma experiência única e persistida.",
      impact: "Aumentar a visibilidade de projetos e encurtar o caminho entre aprendizado, construção e oportunidade.",
      stage: "mvp",
      category: "educação",
      location: "Rio de Janeiro",
      tags: ["edtech", "projetos"],
      needs: ["mentoria"],
      readme: "x".repeat(220),
      cover_path: "project-covers/example.png",
      repository_url: "https://github.com/example/repo",
    });
    expect(result.score).toBe(100);
    expect(result.level).toBe("pronto para apresentar");
    expect(result.missing).toEqual([]);
  });

  it("does not award evidence points when every professional link is absent", () => {
    const result = calculateProjectReadiness({
      short_description: "Descrição suficientemente longa para cumprir o critério mínimo.",
      problem: "p".repeat(50),
      solution: "s".repeat(50),
      impact: "i".repeat(40),
      stage: "ideia",
      category: "tecnologia",
      tags: ["web"],
      needs: ["feedback"],
      readme: "r".repeat(200),
      cover_path: "cover.png",
      location: "RJ",
    });
    expect(result.score).toBe(88);
    expect(result.missing).toEqual(["Evidência externa (site, demo, código ou design)"]);
  });
});
