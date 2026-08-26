import { describe, expect, it } from "vitest";
import { entityFollowKey, toggleEntityFollow } from "./social";

describe("ações sociais de entidades", () => {
  it("gera chaves estáveis para seguir pessoas e equipes", () => {
    expect(entityFollowKey("participant", "u2")).toBe("participant:u2");
    expect(entityFollowKey("team", "t1")).toBe("team:t1");
  });

  it("segue e deixa de seguir sem duplicar", () => {
    const followed = toggleEntityFollow([], "participant:u2");
    expect(followed).toEqual(["participant:u2"]);
    expect(toggleEntityFollow(followed, "participant:u2")).toEqual([]);
    expect(toggleEntityFollow(["team:t1", "team:t1"], "team:t2")).toEqual(["team:t1", "team:t2"]);
  });
});
