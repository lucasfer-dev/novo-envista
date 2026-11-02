import { describe, expect, it } from "vitest";
import { projectProfileFields } from "./profile-fields";

describe("projectProfileFields", () => {
  it("preserva campos opcionais e normaliza tags, sem inventar investimento", () => {
    const form = new FormData();
    form.set("project_type", "startup");
    form.set("target_audience", "Alunos de programação");
    form.set("technologies", "React, Node.js, React");
    form.append("collaboration_roles", "developer");
    form.append("collaboration_roles", "developer");
    form.append("collaboration_roles", "forbidden");
    form.set("business_model", "Não deve salvar");

    expect(projectProfileFields(form)).toMatchObject({
      project_type: "startup",
      target_audience: "Alunos de programação",
      technologies: ["React", "Node.js"],
      collaboration_roles: ["developer"],
      seeking_investment: false,
      business_model: "",
      pitch_deck_url: "",
    });
  });

  it("aceita links HTTPS de pitch quando houver busca de investimento", () => {
    const form = new FormData();
    form.set("seeking_investment", "on");
    form.set("pitch_deck_url", "https://example.com/pitch");
    form.set("investment_amount", "R$ 100.000");
    expect(projectProfileFields(form)).toMatchObject({
      seeking_investment: true,
      investment_amount: "R$ 100.000",
      pitch_deck_url: "https://example.com/pitch",
    });
  });

  it("rejeita protocolos inseguros e tipos de projeto desconhecidos", () => {
    const form = new FormData();
    form.set("project_type", "admin");
    form.set("seeking_investment", "on");
    form.set("pitch_deck_url", "javascript:alert(1)");
    expect(projectProfileFields(form)).toMatchObject({
      project_type: "personal",
      seeking_investment: true,
      pitch_deck_url: "",
    });
  });
});
