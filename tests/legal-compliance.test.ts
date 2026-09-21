import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const validation = readFileSync("lib/auth/validation.ts", "utf8");
const authActions = readFileSync("app/auth/actions.ts", "utf8");
const requireProductUser = readFileSync("lib/auth/require-product-user.ts", "utf8");
const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const guardianRequired = readFileSync("app/guardian-required/page.tsx", "utf8");
const privacy = readFileSync("app/privacy/page.tsx", "utf8");
const terms = readFileSync("app/terms/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20260921143000_legal_compliance_minor_guardian_v3.sql", "utf8");

describe("legal and minor-account compliance", () => {
  it("uses the current public legal document versions", () => {
    expect(validation).toContain('INTERNAL_TERMS_VERSION = "2026-09-21-v3"');
    expect(validation).toContain('INTERNAL_PRIVACY_VERSION = "2026-09-21-v3"');
    expect(terms).toContain("2026-09-21-v3");
    expect(privacy).toContain("2026-09-21-v3");
    expect(migration).toContain("'terms', '2026-09-21-v3'");
    expect(migration).toContain("'privacy', '2026-09-21-v3'");
  });

  it("keeps every minor account behind guardian verification", () => {
    expect(requireProductUser).toContain('context.age_band !== "adult" && !context.guardian_consent_verified_at');
    expect(authActions).toContain('ageBand !== "adult"');
    expect(onboarding).toContain('compliance.age_band !== "adult" && !compliance.guardian_consent_verified_at');
    expect(guardianRequired).toContain('compliance.age_band === "adult"');
  });

  it("enforces guardian clearance in the database authorization layer", () => {
    expect(migration).toContain("create or replace function private.is_participant");
    expect(migration).toContain("c.age_band in ('child', 'adolescent')");
    expect(migration).toContain("c.guardian_consent_verified_at is not null");
    expect(migration).toContain('alter policy "profiles_update_self"');
    expect(migration).toContain('alter policy "onboarding_completions_insert_self_when_ready"');
  });

  it("publishes explicit privacy and support channels", () => {
    expect(privacy).toContain("LEGAL_PRIVACY_EMAIL");
    expect(terms).toContain("LEGAL_SUPPORT_EMAIL");
    expect(privacy).toContain("Direitos dos titulares");
    expect(terms).toContain("Menores de idade");
  });
});
