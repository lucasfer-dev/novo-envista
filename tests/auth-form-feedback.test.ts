import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const validation = readFileSync("lib/auth/validation.ts", "utf8");
const signupReadiness = readFileSync("lib/auth/signup-readiness.ts", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const authActions = readFileSync("app/auth/actions.ts", "utf8");
const authShell = readFileSync("components/auth/AuthShell.tsx", "utf8");
const rootPage = readFileSync("app/page.tsx", "utf8");
const signoutRoute = readFileSync("app/auth/signout/route.ts", "utf8");
const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");
const register = readFileSync("app/register/page.tsx", "utf8");
const registerAction = readFileSync("app/auth/register-product-action.ts", "utf8");
const privacyPage = readFileSync("app/privacy/page.tsx", "utf8");
const securityPage = readFileSync("app/account/security/page.tsx", "utf8");
const securityActions = readFileSync("lib/account/security-actions.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260909213000_cpf_account_identifiers.sql", "utf8");
const hmacMigration = readFileSync("supabase/migrations/20260909214500_cpf_hmac_vault.sql", "utf8");
const cnpjMigration = readFileSync("supabase/migrations/20260915161350_extend_private_identifier_with_cnpj.sql", "utf8");
const cleanupPrivateIdentifierMigration = readFileSync("supabase/migrations/20260916184957_cleanup_legacy_auth_private_identifier_metadata.sql", "utf8");
const privacyV2Migration = readFileSync("supabase/migrations/20260916194322_publish_privacy_2026_09_16_v2_and_fix_legal_context.sql", "utf8");
const cpfLoginFunction = readFileSync("supabase/functions/cpf-login/index.ts", "utf8");

describe("auth form feedback", () => {
  it("requires twelve-character passwords for new credentials", () => {
    expect(validation).toContain("export const MIN_PASSWORD_LENGTH = 12;");
    expect(validation).not.toContain("MIN_PASSWORD_LENGTH = 8");
    expect(securityPage).toContain('minLength={12}');
    expect(securityActions).toContain("validatePassword(password)");
  });

  it("uses the installed Supabase current-password contract for password changes", () => {
    expect(securityActions).toContain("current_password: currentPassword");
    expect(securityPage).toContain('profile?.role === "investor" ? "/investor" : "/home"');
  });

  it("keeps public signup available unless registrations are explicitly paused", () => {
    expect(signupReadiness).toContain('AUTH_SIGNUP_ENABLED !== "false"');
    expect(signupReadiness).not.toContain('AUTH_EMAIL_DELIVERY_READY !== "true"');
    expect(signupReadiness).not.toContain('process.env.NODE_ENV === "production"');
    expect(register).toContain("isPublicSignupReady()");
    expect(registerAction).toContain("!isPublicSignupReady()");
  });

  it("restores valid browser sessions from the root page and logs out locally", () => {
    expect(rootPage).toContain("supabase.auth.getClaims()");
    expect(rootPage).toContain("redirect(homeForRole(parseProductRole(profileResult.data?.role)))");
    expect(signoutRoute).toContain('createClient({ requireCookieWrites: true })');
    expect(signoutRoute).toContain('signOut({ scope: "local" })');
  });

  it("keeps Envista branding visible on auth pages", () => {
    expect(authShell).toContain('src="/brand/envista-symbol-white.svg"');
    expect(authShell).toContain('src="/brand/envista-symbol-gradient.svg"');
    expect(authShell).toContain("<strong>Envista</strong>");
  });

  it("makes institution-related onboarding fields visibly optional", () => {
    expect(onboarding).toContain('Escola/instituição <span className={styles.muted}>(opcional)</span>');
    expect(onboarding).toContain('Organização <span className={styles.muted}>(opcional)</span>');
    expect(onboarding).not.toMatch(/name="public_school"[^>]*required/);
    expect(onboarding).not.toMatch(/name="organization"[^>]*required/);
  });

  it("records the current public legal documents during onboarding", () => {
    expect(validation).toContain('INTERNAL_TERMS_VERSION = "2026-09-21-v3"');
    expect(validation).toContain('INTERNAL_PRIVACY_VERSION = "2026-09-21-v3"');
    expect(authActions).toContain('context: "public_onboarding"');
    expect(authActions).not.toContain('context: "internal_test"');
    expect(privacyPage).toContain("Versão 2026-09-21-v3");
    expect(privacyPage).toContain("CPF ou CNPJ");
    expect(privacyV2Migration).toContain("public_onboarding");
    expect(privacyV2Migration).toContain("2026-09-16-v2");
  });

  it("supports email, CPF and CNPJ login while keeping documents private", () => {
    expect(login).toContain("E-mail, CPF ou CNPJ");
    expect(login).toContain('name="identifier"');
    expect(login).toContain('type="text" name="identifier"');
    expect(login).toContain("identificador privado de acesso");
    expect(register).toContain('name="document"');
    expect(register).toContain("CPF ou CNPJ");
    expect(register).toContain("O valor cru não é exibido no perfil nem salvo nos metadados da sessão");
    expect(registerAction).toContain("privateDocumentKind(documentValue)");
    expect(registerAction).toContain("normalizePrivateDocument(documentValue)");
  });

  it("keeps private document compatibility data out of persisted auth metadata and public profile access", () => {
    expect(migration).toContain("new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'cpf'");
    expect(cnpjMigration).toContain("- 'cpf' - 'cnpj'");
    expect(migration).toContain("revoke all on table public.account_private_identifiers from public, anon, authenticated");
    expect(migration).toContain("alter table public.account_private_identifiers enable row level security");
    expect(cleanupPrivateIdentifierMigration).toContain("raw_user_meta_data");
    expect(cleanupPrivateIdentifierMigration).toContain("- 'cpf' - 'cnpj'");
    expect(onboarding).not.toContain('name="cpf"');
    expect(onboarding).not.toContain('name="cnpj"');
  });

  it("protects CPF/CNPJ lookup with a Vault-managed HMAC key", () => {
    expect(hmacMigration).toContain("vault.create_secret");
    expect(hmacMigration).toContain("extensions.hmac");
    expect(hmacMigration).toContain("envista_cpf_hmac_key");
    expect(hmacMigration).toContain("revoke all on function public.resolve_cpf_login(text) from public, anon, authenticated");
    expect(hmacMigration).toContain("grant execute on function public.resolve_cpf_login(text) to service_role");
    expect(cnpjMigration).toContain("is_valid_cnpj");
    expect(cnpjMigration).toContain("resolve_cpf_login");
    expect(cpfLoginFunction).toContain('rpc("resolve_cpf_login"');
    expect(cpfLoginFunction).toContain("isValidCnpj");
    expect(cpfLoginFunction).not.toContain("sha256Hex");
  });
});
