import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdminUser() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/admin");

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase.from("admin_memberships").select("user_id,created_at").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("id,username,display_name").eq("id", userId).single(),
  ]);

  if (!membership || !profile) redirect("/admin/login?error=forbidden");
  return { supabase, userId, profile, membership };
}
