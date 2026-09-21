import { describe, expect, it } from "vitest";
import {
  ageBandFromBirthDate,
  homeForRole,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidUsername,
  MIN_PASSWORD_LENGTH,
  normalizeCpf,
  parseBirthDate,
  pathAllowedForRole,
  privateDocumentKind,
  safeInternalPath,
  validatePassword,
  normalizeUsername,
} from "./validation";

describe("safeInternalPath", () => {
  it("aceita somente caminhos internos", () => {
    expect(safeInternalPath("/projects?tab=mine", "/login")).toBe("/projects?tab=mine");
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

  it("valida CNPJ e identifica o tipo de documento privado", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(privateDocumentKind("529.982.247-25")).toBe("cpf");
    expect(privateDocumentKind("11.222.333/0001-81")).toBe("cnpj");
  });
});

describe("data de nascimento", () => {
  it("valida a data e deriva a faixa etária sem precisar persistir a data completa", () => {
    const now = new Date("2026-09-21T12:00:00Z");
    expect(parseBirthDate("2007-07-03")).toBe("2007-07-03");
    expect(parseBirthDate("03/07/2007")).toBe("2007-07-03");
    expect(parseBirthDate("31/02/2026")).toBeNull();
    expect(parseBirthDate("2026-02-30")).toBeNull();
    expect(parseBirthDate("2999-01-01")).toBeNull();
    expect(ageBandFromBirthDate("2007-07-03", now)).toBe("adult");
    expect(ageBandFromBirthDate("2010-12-01", now)).toBe("adolescent");
    expect(ageBandFromBirthDate("2020-01-10", now)).toBe("child");
  });
});

describe("rotas por papel", () => {
  it("separa as áreas de participante e investidor", () => {
    expect(homeForRole("participant")).toBe("/home");
    expect(homeForRole("investor")).toBe("/investor");
    expect(pathAllowedForRole("/projects", "participant")).toBe(true);
    expect(pathAllowedForRole("/calendar", "participant")).toBe(true);
    expect(pathAllowedForRole("/app/projects", "participant")).toBe(true);
    expect(pathAllowedForRole("/investor/projects", "participant")).toBe(false);
  });
});
