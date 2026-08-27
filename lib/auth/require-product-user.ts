import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";
import type { User } from "@/types";

export type ProductRole = "participant" | "investor";

function cleanProfileText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function requireProductUser(expectedRole?: ProductRole) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const [profileResult, complianceResult, completionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,username,display_name,role,avatar_path,bio,public_city,public_state,public_school,organization,organization_type")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("account_compliance")
      .select("age_band,guardian_consent_verified_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_completions")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const { data: profile } = profileResult;
  const { data: compliance } = complianceResult;
  const { data: completion } = completionResult;

  // Missing rows mean onboarding is incomplete. Database/network errors are kept
  // distinct so an outage does not incorrectly send a configured user through it.
  if (profileResult.error || complianceResult.error || completionResult.error) {
    redirect("/auth/error?reason=profile-load");
  }

  if (!profile || !compliance || !completion) redirect("/onboarding");
  if (compliance.age_band === "child" && !compliance.guardian_consent_verified_at) {
    redirect("/guardian-required");
  }

  const parsedRole = parseProductRole(profile.role);
  if (parsedRole !== "participant" && parsedRole !== "investor") redirect("/login");
  const role = parsedRole as ProductRole;
  if (expectedRole && role !== expectedRole) redirect(homeForRole(role));

  const username = cleanProfileText(profile.username) || "usuario";
  const name = cleanProfileText(profile.display_name) || username || "Usuário";

  const appUser: User = {
    id: profile.id,
    username,
    name,
    role,
    avatar: cleanProfileText(profile.avatar_path) || undefined,
    bio: cleanProfileText(profile.bio) || undefined,
    school: cleanProfileText(profile.public_school) || undefined,
    city: cleanProfileText(profile.public_city) || undefined,
    state: cleanProfileText(profile.public_state) || undefined,
    organization: cleanProfileText(profile.organization) || undefined,
    organizationType: cleanProfileText(profile.organization_type) || undefined,
  };

  return { supabase, userId, role, profile, compliance, appUser };
}
