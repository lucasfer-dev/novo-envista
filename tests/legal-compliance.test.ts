import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const validation = readFileSync("lib/auth/validation.ts", "utf8");
const authActions = readFileSync("app/auth/actions.ts", "utf8");
const guardianActions = readFileSync("app/guardian/actions.ts", "utf8");
const guardianChoice = readFileSync("app/guardian-choice/page.tsx", "utf8");
const guardianPage = readFileSync("app/guardian/page.tsx", "utf8");
const requireProductUser = readFileSync("lib/auth/require-product-user.ts", "utf8");
const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const socialPage = readFileSync("components/social/LegacySocialServerPage.tsx", "utf8");
const messagesPage = readFileSync("components/real/MessagesServerPages.tsx", "utf8");
const privacy = readFileSync("app/privacy/page.tsx", "utf8");
const terms = readFileSync("app/terms/page.tsx", "utf8");
const signupBirthDateMigration = readFileSync("supabase/migrations/20260921190000_signup_birthdate_required.sql", "utf8");
const guardianMigration = readFileSync("supabase/migrations/20260925115853_guardian_protected_mode.sql", "utf8");
const legalV6Migration = readFileSync("supabase/migrations/20260925120514_publish_guardian_protected_mode_legal_v6.sql", "utf8");
const minorSignupRepairMigration = readFileSync("supabase/migrations/20260925203000_repair_minor_signup_and_identifier_privacy.sql", "utf8");
const registerProductAction = readFileSync("app/auth/register-product-action.ts", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const privacyChannelMigration = readFileSync("supabase/migrations/20260921150500_public_privacy_contact_channel.sql", "utf8");
const privacyContact = readFileSync("app/privacy/contact/page.tsx", "utf8");
const adminPrivacy = readFileSync("app/admin/privacy/page.tsx", "utf8");

describe("legal and minor-account compliance", () => {
  it("uses the current public legal document versions", () => {
    expect(validation).toContain('INTERNAL_TERMS_VERSION = "2026-09-25-v6"');
    expect(validation).toContain('INTERNAL_PRIVACY_VERSION = "2026-09-25-v6"');
    expect(terms).toContain("2026-09-25-v6");
    expect(privacy).toContain("2026-09-25-v6");
    expect(legalV6Migration).toContain("'terms', '2026-09-25-v6'");
    expect(legalV6Migration).toContain("'privacy', '2026-09-25-v6'");
  });

  it("derives age during signup, discards the exact birth date, and derives guardian requirement", () => {
    expect(signupBirthDateMigration).toContain("birth_date");
    expect(signupBirthDateMigration).toContain("derived_age_band");
    expect(signupBirthDateMigration).toContain("- 'birth_date'");
    expect(minorSignupRepairMigration).toContain("derived_guardian_required := calculated_age < 18");
    expect(minorSignupRepairMigration).toContain("age_band = 'adolescent'::public.age_band");
    expect(guardianMigration).toContain("'signup_guardian_required'");
    expect(guardianMigration).toContain("- 'signup_guardian_required'");
  });


  it("keeps CPF/CNPJ availability private and fixes the signup trigger regression", () => {
    expect(registerProductAction).not.toContain('rpc("signup_identifier_available"');
    expect(minorSignupRepairMigration).toContain(
      "revoke all on function public.signup_identifier_available(text,text) from public, anon, authenticated",
    );
    expect(minorSignupRepairMigration).toContain(
      "terms_accepted boolean := coalesce(",
    );
    expect(minorSignupRepairMigration).not.toContain("pg_catalog.coalesce");
    expect(minorSignupRepairMigration).toContain(
      "raw_birth_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}
    expect(guardianChoice).toContain("Continuar no modo protegido");
    expect(guardianActions).toContain('rpc("start_protected_minor_mode")');
    expect(requireProductUser).toContain('context.age_band === "child"');
    expect(requireProductUser).toContain('context.age_band === "adolescent"');
    expect(requireProductUser).toContain("context.protected_mode_started_at");
    expect(onboarding).toContain("Modo protegido ativo");
    expect(authActions).toContain('return "/guardian-choice"');
  });

  it("keeps social and direct messages locked until guardian confirmation", () => {
    expect(guardianMigration).toContain("create or replace function private.has_social_access");
    expect(guardianMigration).toContain("private.has_social_access()");
    expect(socialPage).toContain("compliance.guardian_locked");
    expect(socialPage).toContain('feature="social"');
    expect(messagesPage).toContain("compliance.guardian_locked");
    expect(messagesPage).toContain('feature="messages"');
  });

  it("keeps guardian verification separate from a social profile and protects identifiers", () => {
    expect(guardianPage).toContain("O responsável não recebe perfil público");
    expect(guardianMigration).toContain("guardian_document_hash");
    expect(guardianMigration).toContain("private.cpf_identifier_hash");
    expect(guardianMigration).toContain("private.guardian_token_hash");
    expect(guardianMigration).not.toContain("guardian_cpf text");
    expect(guardianMigration).toContain("declaration_version");
  });

  it("publishes explicit privacy and support channels", () => {
    expect(privacy).toContain("LEGAL_PRIVACY_EMAIL");
    expect(terms).toContain("LEGAL_SUPPORT_EMAIL");
    expect(privacy).toContain("Direitos dos titulares");
    expect(privacy).toContain("/privacy/contact");
    expect(privacyContact).toContain("Privacidade e seus direitos");
    expect(privacyChannelMigration).toContain("privacy_contact_requests");
    expect(adminPrivacy).toContain("Canal público");
    expect(terms).toContain("Crianças e adolescentes");
  });
});
",
    );
  });

  it("prevents guardian confirmation tokens from leaking through referrers or caches", () => {
    expect(proxy).toContain('pathname === "/guardian/confirm"');
    expect(proxy).toContain('pathname === "/guardian/pending"');
    expect(proxy).toContain('response.headers.set("Referrer-Policy", "no-referrer")');
    expect(proxy).toContain('response.headers.set("Cache-Control", "private, no-store, max-age=0")');
  });

  it("allows adolescents to choose protected mode while keeping children behind guardian confirmation", () => {
    expect(guardianChoice).toContain("Continuar no modo protegido");
    expect(guardianActions).toContain('rpc("start_protected_minor_mode")');
    expect(requireProductUser).toContain('context.age_band === "child"');
    expect(requireProductUser).toContain('context.age_band === "adolescent"');
    expect(requireProductUser).toContain("context.protected_mode_started_at");
    expect(onboarding).toContain("Modo protegido ativo");
    expect(authActions).toContain('return "/guardian-choice"');
  });

  it("keeps social and direct messages locked until guardian confirmation", () => {
    expect(guardianMigration).toContain("create or replace function private.has_social_access");
    expect(guardianMigration).toContain("private.has_social_access()");
    expect(socialPage).toContain("compliance.guardian_locked");
    expect(socialPage).toContain('feature="social"');
    expect(messagesPage).toContain("compliance.guardian_locked");
    expect(messagesPage).toContain('feature="messages"');
  });

  it("keeps guardian verification separate from a social profile and protects identifiers", () => {
    expect(guardianPage).toContain("O responsável não recebe perfil público");
    expect(guardianMigration).toContain("guardian_document_hash");
    expect(guardianMigration).toContain("private.cpf_identifier_hash");
    expect(guardianMigration).toContain("private.guardian_token_hash");
    expect(guardianMigration).not.toContain("guardian_cpf text");
    expect(guardianMigration).toContain("declaration_version");
  });

  it("publishes explicit privacy and support channels", () => {
    expect(privacy).toContain("LEGAL_PRIVACY_EMAIL");
    expect(terms).toContain("LEGAL_SUPPORT_EMAIL");
    expect(privacy).toContain("Direitos dos titulares");
    expect(privacy).toContain("/privacy/contact");
    expect(privacyContact).toContain("Privacidade e seus direitos");
    expect(privacyChannelMigration).toContain("privacy_contact_requests");
    expect(adminPrivacy).toContain("Canal público");
    expect(terms).toContain("Crianças e adolescentes");
  });
});
