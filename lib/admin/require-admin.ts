import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getAdminContext() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const aal = claimsData?.claims?.aal === "aal2" ? "aal2" : "aal1";
  if (claimsError || !userId) redirect("/login?next=/admin");

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase.from("admin_memberships").select("user_id,created_at").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("id,username,display_name").eq("id", userId).single(),
  ]);

  if (!membership || !profile) redirect("/admin/login?error=forbidden");
  return { supabase, userId, profile, membership, aal };
}

/**
 * Confirma somente a associação administrativa. Usado exclusivamente pelo fluxo
 * de matrícula/desafio MFA, que precisa permanecer acessível enquanto a sessão
 * ainda está em aal1.
 */
export async function requireAdminIdentity() {
  return getAdminContext();
}

/**
 * Toda tela/ação administrativa normal exige associação admin + sessão aal2.
 * Uma senha roubada, sozinha, não é suficiente para acessar o painel.
 */
export async function requireAdminUser() {
  const context = await getAdminContext();
  if (context.aal !== "aal2") redirect("/admin-mfa");
  return context;
}
