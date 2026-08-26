import { describe, expect, it } from "vitest";
import { hasSupabaseAuthCookieNames } from "./auth-cookie";

describe("hasSupabaseAuthCookieNames", () => {
  it("ignora cookies sem relação com autenticação", () => {
    expect(hasSupabaseAuthCookieNames([])).toBe(false);
    expect(hasSupabaseAuthCookieNames(["theme", "session_hint"])).toBe(false);
  });

  it("detecta sessão, chunks e verifier PKCE do Supabase", () => {
    expect(hasSupabaseAuthCookieNames(["sb-project-auth-token"])).toBe(true);
    expect(hasSupabaseAuthCookieNames(["sb-project-auth-token.0"])).toBe(true);
    expect(hasSupabaseAuthCookieNames(["sb-project-auth-token-code-verifier"])).toBe(true);
  });

  it("não aceita um nome parecido sem prefixo Supabase", () => {
    expect(hasSupabaseAuthCookieNames(["fake-auth-token"])).toBe(false);
  });
});
