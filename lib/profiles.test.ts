import { describe, expect, it } from "vitest";
import { getInvestorById, getParticipantById, getTeamById, profileRoute } from "./profiles";

describe("perfis navegaveis", () => {
  it("resolve participante por id e username", () => {
    expect(getParticipantById("u2")?.username).toBe("anasouza");
    expect(getParticipantById("lucasfer")?.id).toBe("u1");
  });

  it("resolve investidor e equipe por identificadores estaveis", () => {
    expect(getInvestorById("marinaalves")?.id).toBe("i1");
    expect(getTeamById("atlas")?.id).toBe("t1");
  });

  it("retorna undefined para perfis inexistentes", () => {
    expect(getParticipantById("inexistente")).toBeUndefined();
    expect(getInvestorById("inexistente")).toBeUndefined();
    expect(getTeamById("inexistente")).toBeUndefined();
  });

  it("gera rotas coerentes com cada contexto", () => {
    expect(profileRoute("participant", "anasouza")).toBe("/app/participants/anasouza");
    expect(profileRoute("investor", "marinaalves", "investor")).toBe("/investor/investors/marinaalves");
    expect(profileRoute("team", "atlas")).toBe("/app/teams/atlas");
  });
});
