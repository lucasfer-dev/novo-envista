import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";
import type { User } from "@/types";

export type ProductRole = "participant" | "investor";

type ProductUserContext = {
  id: string;
  username: string | null;
  display_name: string | null;
  role: string | null;
  avatar_path: string | null;
  bio: string | null;
  public_city: string | null;
  public_state: string | null;
  public_school: string | null;
  organization: string | null;
  organization_type: string | null;
  age_band: string | null;
  guardian_consent_verified_at: string | null;
  onboarding_completed: boolean;
};

export async function requireProductUser(expectedRole?: ProductRole) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: contextRows, error: contextError } = await supabase.rpc("get_product_user_context");
  if (contextError) redirect("/auth/error?reason=profile-query");

  const context = (Array.isArray(contextRows) ? contextRows[0] : null) as ProductUserContext | null;
  if (!context || !context.age_band || !context.onboarding_completed) redirect("/onboarding");
  if (context.age_band === "child" && !context.guardian_consent_verified_at) {
    redirect("/guardian-required");
  }

  const parsedRole = parseProductRole(context.role);
  if (parsedRole !== "participant" && parsedRole !== "investor") redirect("/login");
  const role = parsedRole as ProductRole;
  if (expectedRole && role !== expectedRole) redirect(homeForRole(role));

  const appUser: User = {
    id: context.id,
    username: context.username || "usuario",
    name: context.display_name || context.username || "Usuário",
    role,
    avatar: context.avatar_path || undefined,
    bio: context.bio || undefined,
    school: context.public_school || undefined,
    city: context.public_city || undefined,
    state: context.public_state || undefined,
    organization: context.organization || undefined,
    organizationType: context.organization_type || undefined,
  };

  const profile = {
    id: context.id,
    username: context.username,
    display_name: context.display_name,
    role: context.role,
    avatar_path: context.avatar_path,
    bio: context.bio,
    public_city: context.public_city,
    public_state: context.public_state,
    public_school: context.public_school,
    organization: context.organization,
    organization_type: context.organization_type,
  };

  const compliance = {
    age_band: context.age_band,
    guardian_consent_verified_at: context.guardian_consent_verified_at,
  };

  return { supabase, userId, role, profile, compliance, appUser };
}
