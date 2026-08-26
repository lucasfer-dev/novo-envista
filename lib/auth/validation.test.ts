import { describe, expect, it } from "vitest";
import {
  homeForRole,
  isValidEmail,
  isValidUsername,
  normalizeUsername,
  pathAllowedForRole,
  safeInternalPath,
  validatePassword,
} from "./validation";

describe("safeInternalPath", () => {
  it("aceita somente caminhos internos", () => {
    expect(safeInternalPath("/app/projects?tab=mine", "/login")).toBe("/app/projects?tab=mine");
    expect(safeInternalPath("https://evil.example", "/login")).toBe("/login");
    expect(safeInternalPath("//evil.example", "/login")).toBe("/login");
    expect(safeInternalPath("/app\\evil", "/login")).toBe("/login");
    expect(safeInternalPath("/app\nSet-Cookie:x", "/login")).toBe("/login");
  });
});

describe("username", () => {
  it("normaliza sem ampliar o conjunto permitido", () => {
    expect(normalizeUsername(" Lucas Fér! ")).toBe("lucas_fer");
    expect(isValidUsername("lucas_fer")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
  });
});

describe("credenciais", () => {
  it("valida email de forma básica e senha por comprimento", () => {
    expect(isValidEmail("pessoa@example.com")).toBe(true);
    expect(isValidEmail("invalido@" )).toBe(false);
    expect(validatePassword("123456789")).toBeTruthy();
    expect(validatePassword("uma-senha-comprida")).toBeNull();
  });
});

describe("rotas por papel", () => {
  it("separa as áreas de participante e investidor", () => {
    expect(homeForRole("participant")).toBe("/app");
    expect(homeForRole("investor")).toBe("/investor");
    expect(pathAllowedForRole("/app/projects", "participant")).toBe(true);
    expect(pathAllowedForRole("/investor/projects", "participant")).toBe(false);
  });
});
