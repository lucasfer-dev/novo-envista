import { describe, expect, it } from "vitest";
import { canFollowProject, getGreeting, normalizeSearch, toggleSocialPostLike, validateParticipantLocation } from "./mvp";

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
});
