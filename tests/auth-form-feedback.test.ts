import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const validation = readFileSync("lib/auth/validation.ts", "utf8");
const authShell = readFileSync("components/auth/AuthShell.tsx", "utf8");
const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");
const register = readFileSync("app/register/page.tsx", "utf8");
const actions = readFileSync("app/auth/actions.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260909213000_cpf_account_identifiers.sql", "utf8");
const hmacMigration = readFileSync("supabase/migrations/20260909214500_cpf_hmac_vault.sql", "utf8");
const cpfLoginFunction = readFileSync("supabase/functions/cpf-login/index.ts", "utf8");

describe("auth form feedback", () => {
  it("requires twelve-character passwords for new credentials", () => {
    expect(validation).toContain("export const MIN_PASSWORD_LENGTH = 12;");
    expect(validation).not.toContain("MIN_PASSWORD_LENGTH = 8");
  });

  it("keeps Envista branding visible on auth pages", () => {
    expect(authShell).toContain('src="/envista-logo.png"');
    expect(authShell).toContain("<span>Envista</span>");
  });

  it("makes institution-related onboarding fields visibly optional", () => {
    expect(onboarding).toContain('Escola/instituição <span className={styles.muted}>(opcional)</span>');
    expect(onboarding).toContain('Organização <span className={styles.muted}>(opcional)</span>');
    expect(onboarding).not.toMatch(/name="public_school"[^>]*required/);
    expect(onboarding).not.toMatch(/name="organization"[^>]*required/);
  });

  it("accepts email or CPF as the login identifier and asks CPF on signup", () => {
    expect(login).toContain("E-mail ou CPF");
    expect(login).toContain('name="identifier"');
    expect(register).toContain('name="cpf"');
    expect(register).toContain("O CPF não aparece no seu perfil");
    expect(actions).toContain("isValidCpf");
    expect(actions).toContain("signInWithCpf");
  });

  it("keeps CPF out of public profile data and browser-readable table access", () => {
    expect(migration).toContain("new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf'");
    expect(migration).toContain("revoke all on table public.account_private_identifiers from public, anon, authenticated");
    expect(migration).toContain("alter table public.account_private_identifiers enable row level security");
    expect(onboarding).not.toContain('name="cpf"');
  });

  it("protects deterministic CPF lookup with a Vault-managed HMAC key", () => {
    expect(hmacMigration).toContain("vault.create_secret");
    expect(hmacMigration).toContain("extensions.hmac");
    expect(hmacMigration).toContain("envista_cpf_hmac_key");
    expect(hmacMigration).toContain("revoke all on function public.resolve_cpf_login(text) from public, anon, authenticated");
    expect(hmacMigration).toContain("grant execute on function public.resolve_cpf_login(text) to service_role");
    expect(cpfLoginFunction).toContain('rpc("resolve_cpf_login"');
    expect(cpfLoginFunction).not.toContain("sha256Hex");
  });
});
