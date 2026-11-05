import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/20261105160000_complete_onboarding_atomic.sql", "utf8");
const actions = readFileSync("app/auth/actions.ts", "utf8");

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
  it("only records currently active terms and privacy versions", () => {
    expect(sql).toContain("where document_type='terms' and document_version=v_terms and active=true");
    expect(sql).toContain("where document_type='privacy' and document_version=v_privacy and active=true");
    expect(sql).toContain("on conflict (user_id,document_type,document_version) do nothing");
  });
});
