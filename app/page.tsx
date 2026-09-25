import { redirect } from "next/navigation";
import PublicLandingServer from "@/components/public/PublicLandingServer";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!claimsError && userId) {
    const [profileResult, complianceResult, completionResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
      supabase
        .from("account_compliance")
        .select("age_band,guardian_required,guardian_consent_verified_at,protected_mode_started_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);

    if (!profileResult.error && !complianceResult.error && !completionResult.error) {
      const compliance = complianceResult.data;

      if (
        compliance?.age_band === "child" &&
        compliance.guardian_required &&
        !compliance.guardian_consent_verified_at
      ) {
        redirect("/guardian");
      }

      if (
        compliance?.age_band === "adolescent" &&
        compliance.guardian_required &&
        !compliance.guardian_consent_verified_at &&
        !compliance.protected_mode_started_at
      ) {
        redirect("/guardian-choice");
      }

      if (!completionResult.data) redirect("/onboarding");
      redirect(homeForRole(parseProductRole(profileResult.data?.role)));
    }
  }

  return <PublicLandingServer />;
}
