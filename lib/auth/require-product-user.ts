import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";
import type { User } from "@/types";

export type ProductRole = "participant" | "investor";

export async function requireProductUser(expectedRole?: ProductRole) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const [{ data: profile }, { data: compliance }, { data: completion }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,username,display_name,role,avatar_path,bio,public_city,public_state,public_school,organization,organization_type")
      .eq("id", userId)
      .single(),
    supabase
      .from("account_compliance")
      .select("age_band,guardian_consent_verified_at")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("onboarding_completions")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!profile || !compliance || !completion) redirect("/onboarding");
  if (compliance.age_band === "child" && !compliance.guardian_consent_verified_at) {
    redirect("/guardian-required");
  }

  const parsedRole = parseProductRole(profile.role);
  if (parsedRole !== "participant" && parsedRole !== "investor") redirect("/login");
  const role = parsedRole as ProductRole;
  if (expectedRole && role !== expectedRole) redirect(homeForRole(role));

  const appUser: User = {
    id: profile.id,
    username: profile.username,
    name: profile.display_name,
    role,
    avatar: profile.avatar_path || undefined,
    bio: profile.bio || undefined,
    school: profile.public_school || undefined,
    city: profile.public_city || undefined,
    state: profile.public_state || undefined,
    organization: profile.organization || undefined,
    organizationType: profile.organization_type || undefined,
  };

  return { supabase, userId, role, profile, compliance, appUser };
}
