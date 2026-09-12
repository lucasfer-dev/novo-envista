import { describe, expect, it } from "vitest";
import {
  homeForRole,
  isValidCpf,
  isValidEmail,
  isValidUsername,
  MIN_PASSWORD_LENGTH,
  normalizeCpf,
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
    expect(safeInternalPath("javascript:alert(1)", "/login")).toBe("/login");
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
    expect(isValidEmail("invalido@")).toBe(false);
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    expect(validatePassword("12345678901")).toBeTruthy();
    expect(validatePassword("123456789012")).toBeNull();
    expect(validatePassword("uma-senha-comprida")).toBeNull();
    expect(validatePassword("x".repeat(129))).toBeTruthy();
  });

  it("normaliza e valida CPF pelos dígitos verificadores", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
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
