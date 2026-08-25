import { describe, expect, it } from "vitest";
import { canFollowProject, getGreeting, getOnboardingValidationError, normalizeSearch, OnboardingValidationValues, toggleSocialPostLike, validateParticipantLocation } from "./mvp";

describe("regras do MVP", () => {
  it("calcula a saudação por faixa horária", () => {
    expect(getGreeting(6)).toBe("Bom dia");
    expect(getGreeting(11)).toBe("Bom dia");
    expect(getGreeting(12)).toBe("Boa tarde");
    expect(getGreeting(18)).toBe("Boa tarde");
    expect(getGreeting(19)).toBe("Boa noite");
    expect(getGreeting(2)).toBe("Boa noite");
  });

  it("exige cidade e estado preenchidos", () => {
    expect(validateParticipantLocation("Rio de Janeiro", "RJ")).toBe(true);
    expect(validateParticipantLocation("", "RJ")).toBe(false);
    expect(validateParticipantLocation("Rio", " ")).toBe(false);
  });

  it("normaliza pesquisas", () => {
    expect(normalizeSearch("  Equipe Atlas  ")).toBe("equipe atlas");
  });

  it("impede seguir projetos próprios", () => {
    expect(canFollowProject("user", "u1")).toBe(false);
    expect(canFollowProject("team", "t1")).toBe(false);
    expect(canFollowProject("team", "t5")).toBe(true);
  });

  it("alterna uma única curtida por usuário em uma publicação social", () => {
    const posts = [{ id: "s1", likes: 18 }];
    const firstLike = toggleSocialPostLike(posts, [], "s1");

    expect(firstLike.posts[0].likes).toBe(19);
    expect(firstLike.likedPostIds).toEqual(["s1"]);
    expect(firstLike.liked).toBe(true);

    const unlike = toggleSocialPostLike(firstLike.posts, firstLike.likedPostIds, "s1");
    expect(unlike.posts[0].likes).toBe(18);
    expect(unlike.likedPostIds).toEqual([]);
    expect(unlike.liked).toBe(false);
  });

  it("valida todas as etapas obrigatórias do onboarding de participante", () => {
    const values: OnboardingValidationValues = {
      name: " ", username: "", city: "", state: "", organizationType: "Pessoa física",
      organizationName: "", location: "", description: "", participantSkills: [],
      participantGoals: [], investorSectors: [], investorStages: [],
    };

    expect(getOnboardingValidationError("participant", 1, values)).toContain("Nome e Username");
    expect(getOnboardingValidationError("participant", 2, values)).toContain("Cidade e Estado");
    expect(getOnboardingValidationError("participant", 3, values)).toContain("habilidade");
    expect(getOnboardingValidationError("participant", 4, values)).toContain("objetivo inicial");
    expect(getOnboardingValidationError("participant", 1, { ...values, name: "Ana", username: "ana" })).toBe("");
  });

  it("valida os campos condicionais e seleções do onboarding de investidor", () => {
    const values: OnboardingValidationValues = {
      name: "João", username: "", city: "", state: "", organizationType: "Empresa",
      organizationName: " ", location: "", description: "", participantSkills: [],
      participantGoals: [], investorSectors: [], investorStages: [],
    };

    expect(getOnboardingValidationError("investor", 1, values)).toContain("nome da organização");
    expect(getOnboardingValidationError("investor", 1, { ...values, organizationType: "Pessoa física" })).toBe("");
    expect(getOnboardingValidationError("investor", 2, values)).toContain("Localização e Descrição");
    expect(getOnboardingValidationError("investor", 3, values)).toContain("setor de interesse");
    expect(getOnboardingValidationError("investor", 4, values)).toContain("estágio preferido");
  });
});
