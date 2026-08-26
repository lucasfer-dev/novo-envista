import { describe, expect, it } from "vitest";
import { entityRoute, getInvestorById, getParticipantById, getTeamById, parsePublicEntityRoute, profileRoute } from "./profiles";

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

  it("separa equipes publicas de Explore, Social e gerenciamento", () => {
    expect(entityRoute({ type: "team", id: "atlas", source: "explore" })).toBe("/app/explore/teams/atlas");
    expect(entityRoute({ type: "team", id: "atlas", source: "social" })).toBe("/app/social/teams/atlas");
    expect(entityRoute({ type: "team", id: "atlas", source: "management" })).toBe("/app/teams/atlas");
  });

  it("separa projetos publicos de projetos gerenciaveis", () => {
    expect(entityRoute({ type: "project", id: "aqua", source: "explore" })).toBe("/app/explore/projects/aqua");
    expect(entityRoute({ type: "project", id: "aqua", source: "management" })).toBe("/app/projects/aqua");
  });

  it("mantem participantes no contexto de descoberta", () => {
    expect(entityRoute({ type: "participant", id: "anasouza", source: "social" })).toBe("/app/social/participants/anasouza");
    expect(entityRoute({ type: "participant", id: "anasouza", source: "explore" })).toBe("/app/explore/participants/anasouza");
  });

  it("mantem perfis e entidades no contexto de Mensagens", () => {
    expect(entityRoute({ type: "participant", id: "anasouza", source: "messages" })).toBe("/app/messages/participants/anasouza");
    expect(entityRoute({ type: "team", id: "atlas", source: "messages", context: "investor" })).toBe("/investor/messages/teams/atlas");
  });

  it("interpreta rotas publicas diretas e rejeita rotas invalidas", () => {
    expect(parsePublicEntityRoute("/investor/explore/projects/aqua")).toEqual({ context: "investor", source: "explore", type: "project", id: "aqua" });
    expect(parsePublicEntityRoute("/app/messages/participants/anasouza")).toEqual({ context: "participant", source: "messages", type: "participant", id: "anasouza" });
    expect(parsePublicEntityRoute("/app/explore/projects/nao-existe")?.id).toBe("nao-existe");
    expect(parsePublicEntityRoute("/app/projects/aqua")).toBeUndefined();
  });
});
