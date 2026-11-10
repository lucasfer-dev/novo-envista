import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/20261105160000_complete_onboarding_atomic.sql", "utf8");
const actions = readFileSync("app/auth/actions.ts", "utf8");
const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const tagsUi = readFileSync("components/auth/InterestTagsField.tsx", "utf8");
const registerShell = readFileSync("components/auth/RegisterShell.tsx", "utf8");


describe("transactional onboarding", () => {
  it("allows only the authenticated account to update its own profile", () => {
    expect(sql).toContain("v_user uuid := (select auth.uid())");
    expect(sql).toContain("where id=v_user");
    expect(sql).toContain("where user_id=v_user");
    expect(sql).toContain("revoke all on function public.complete_onboarding_atomic");
    expect(sql).toContain("to authenticated");
    expect(sql).not.toContain("grant execute on function public.complete_onboarding_atomic(jsonb)\n  to anon");
  });
  it("keeps guardian restrictions and does not complete protected accounts prematurely", () => {
    expect(sql).toContain("return 'guardian'");
    expect(sql).toContain("return 'guardian-choice'");
    expect(sql.indexOf("return 'guardian'")).toBeLessThan(sql.indexOf("insert into public.onboarding_completions"));
    expect(sql).toContain("allow_messages=false");
    expect(sql).toContain("profile_visibility='private'");
  });
  it("uses one RPC call instead of independent profile/legal/age writes", () => {
    const section = actions.split("export async function onboardingAction(")[1].split("export async function profileUpdateAction")[0];
    expect(section).toContain('supabase.rpc("complete_onboarding_atomic", { payload })');
    expect(section).not.toContain('.from("legal_acceptances").insert');
    expect(section).not.toContain('.from("profiles").update');
    expect(section).not.toContain('.from("onboarding_completions").insert');
    expect(section).toContain("auth.onboarding_atomic_failed");
  });
  it("uses the shared registration identity in profile step", () => {
    expect(onboarding).toContain('phase="profile"');
    expect(onboarding).toContain("<RegisterShell");
    expect(onboarding).toContain("<InterestTagsField");
    expect(registerShell).toContain('phase === "profile" ? 3');
    expect(onboarding).toContain('name="terms"');
    expect(onboarding).toContain('name="privacy"');
    expect(onboarding).toContain("onboardingAction");
  });
  it("offers more interests, custom tags and preserves the atomic payload contract", () => {
    expect(tagsUi).toContain('export const MAX_INTEREST_TAGS = 12');
    expect(tagsUi).toContain('"Impacto social"');
    expect(tagsUi).toContain('"Cibersegurança"');
    expect(tagsUi).toContain('"Audiovisual"');
    expect(tagsUi).toContain('"Meio ambiente"');
    expect(tagsUi).toContain('name="interest_tags"');
    expect(tagsUi).toContain('name="interest_tags_other"');
    expect(tagsUi).toContain('aria-pressed={active}');
    expect(tagsUi).toContain('aria-label={`Remover interesse ${tag}`}');
    expect(tagsUi).toContain("localStorage.setItem");
    expect(actions).toContain('interest_tags: interestTags(formData)');
    expect(sql).toContain("pg_catalog.jsonb_array_length(payload -> 'interest_tags') > 12");
  });
  it("uses progressive disclosure for optional profile fields without removing their submission names", () => {
    expect(onboarding).toContain("className={styles.optionalDetails}");
    expect(onboarding).toContain("Sobre você");
    expect(onboarding).toContain("profile.bio || profile.public_school");
    expect(onboarding).toContain('name="bio"');
    expect(onboarding).toContain('name="public_school"');
    expect(onboarding).toContain('name="organization"');
    expect(onboarding).toContain('name="organization_type"');
    expect(onboarding).toContain("<BrazilLocationFields");
    expect(onboarding).toContain('name="age_band"');
    expect(onboarding).toContain("onboardingAction");
  });
  it("shows eight featured interest choices and safely reveals more", () => {
    expect(tagsUi).toContain("const FEATURED_TAG_COUNT = 8");
    expect(tagsUi).toContain("const [showAll, setShowAll] = useState(false)");
    expect(tagsUi).toContain("index < FEATURED_TAG_COUNT || selected.includes(tag)");
    expect(tagsUi).toContain("aria-expanded={showAll}");
    expect(tagsUi).toContain("Ver todos os interesses");
    expect(tagsUi).toContain("Mostrar menos interesses");
    expect(tagsUi).toContain('type="hidden" key={tag} name="interest_tags"');
    expect(tagsUi).toContain('name="interest_tags_other"');
  });
  it("only records currently active terms and privacy versions", () => {
    expect(sql).toContain("where document_type='terms' and document_version=v_terms and active=true");
    expect(sql).toContain("where document_type='privacy' and document_version=v_privacy and active=true");
    expect(sql).toContain("on conflict (user_id,document_type,document_version) do nothing");
  });
});
