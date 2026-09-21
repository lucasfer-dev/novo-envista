import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const validation = readFileSync("lib/auth/validation.ts", "utf8");
const authActions = readFileSync("app/auth/actions.ts", "utf8");
const requireProductUser = readFileSync("lib/auth/require-product-user.ts", "utf8");
const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const guardianRequired = readFileSync("app/guardian-required/page.tsx", "utf8");
const privacy = readFileSync("app/privacy/page.tsx", "utf8");
const terms = readFileSync("app/terms/page.tsx", "utf8");
const minorMigration = readFileSync("supabase/migrations/20260921143000_legal_compliance_minor_guardian_v3.sql", "utf8");
const signupBirthDateMigration = readFileSync("supabase/migrations/20260921190000_signup_birthdate_required.sql", "utf8");
const legalV4Migration = readFileSync("supabase/migrations/20260921191000_publish_legal_signup_identity_v4.sql", "utf8");
const privacyChannelMigration = readFileSync("supabase/migrations/20260921150500_public_privacy_contact_channel.sql", "utf8");
const privacyContact = readFileSync("app/privacy/contact/page.tsx", "utf8");
const adminPrivacy = readFileSync("app/admin/privacy/page.tsx", "utf8");

describe("legal and minor-account compliance", () => {
  it("uses the current public legal document versions", () => {
    expect(validation).toContain('INTERNAL_TERMS_VERSION = "2026-09-21-v5"');
    expect(validation).toContain('INTERNAL_PRIVACY_VERSION = "2026-09-21-v5"');
    expect(terms).toContain("2026-09-21-v5");
    expect(privacy).toContain("2026-09-21-v5");
    expect(legalV4Migration).toContain("'terms', '2026-09-21-v5'");
    expect(legalV4Migration).toContain("'privacy', '2026-09-21-v5'");
  });

  it("derives age during signup and discards the exact birth date", () => {
    expect(signupBirthDateMigration).toContain("birth_date");
    expect(signupBirthDateMigration).toContain("derived_age_band");
    expect(signupBirthDateMigration).toContain("- 'birth_date'");
    expect(signupBirthDateMigration).toContain("signup_terms_acceptance");
    expect(signupBirthDateMigration).toContain("signup_privacy_acknowledgement");
    expect(signupBirthDateMigration).toContain("- 'signup_terms_version'");
    expect(signupBirthDateMigration).toContain("- 'signup_privacy_version'");
  });

  it("keeps every minor account behind guardian verification", () => {
    expect(requireProductUser).toContain('context.age_band !== "adult" && !context.guardian_consent_verified_at');
    expect(authActions).toContain('ageBand !== "adult"');
    expect(onboarding).toContain('compliance.age_band !== "adult" && !compliance.guardian_consent_verified_at');
    expect(guardianRequired).toContain('compliance.age_band === "adult"');
  });

  it("enforces guardian clearance in the database authorization layer", () => {
    expect(minorMigration).toContain("create or replace function private.is_participant");
    expect(minorMigration).toContain("c.age_band in ('child', 'adolescent')");
    expect(minorMigration).toContain("c.guardian_consent_verified_at is not null");
    expect(minorMigration).toContain('alter policy "profiles_update_self"');
    expect(minorMigration).toContain('alter policy "onboarding_completions_insert_self_when_ready"');
  });

  it("publishes explicit privacy and support channels", () => {
    expect(privacy).toContain("LEGAL_PRIVACY_EMAIL");
    expect(terms).toContain("LEGAL_SUPPORT_EMAIL");
    expect(privacy).toContain("Direitos dos titulares");
    expect(privacy).toContain("/privacy/contact");
    expect(privacyContact).toContain("Privacidade e seus direitos");
    expect(privacyChannelMigration).toContain("privacy_contact_requests");
    expect(adminPrivacy).toContain("Canal público");
    expect(terms).toContain("Menores de idade");
  });
});
