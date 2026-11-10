import { describe, expect, it } from "vitest";
import { caretAfterDigits, formatCpfCnpj } from "./format-cpf-cnpj";

describe("CPF/CNPJ mask", () => {
  it("formats CPF while typing and when pasted", () => {
    expect(formatCpfCnpj("529")).toBe("529");
    expect(formatCpfCnpj("5299")).toBe("529.9");
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfCnpj("529.982.247-25")).toBe("529.982.247-25");
  });
  it("formats complete CNPJ and limits input to 14 digits", () => {
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatCpfCnpj("11.222.333/0001-81")).toBe("11.222.333/0001-81");
    expect(formatCpfCnpj("11.222.333/0001-81999")).toBe("11.222.333/0001-81");
  });
  it("keeps the caret aligned to digits when punctuation is inserted", () => {
    expect(caretAfterDigits("529.982.247-25", 4)).toBe(5);
    expect(caretAfterDigits("11.222.333/0001-81", 8)).toBe(10);
    expect(caretAfterDigits("529.982.247-25", 0)).toBe(0);
  });
});
