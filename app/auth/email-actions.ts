"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function tokenHashFrom(formData: FormData) {
  const raw = formData.get("token_hash");
  return typeof raw === "string" ? raw.trim().slice(0, 2048) : "";
}

function authError(flow: "confirmation" | "recovery", reason: string) {
  return `/auth/error?reason=${encodeURIComponent(reason)}&flow=${flow}`;
}

/**
 * Consome o token de confirmação somente depois de uma ação explícita do usuário.
 * Isso evita que scanners/prefetchers de provedores de e-mail confirmem a conta
 * antes de o usuário abrir a página do Envista.
 */
export async function confirmEmailAction(formData: FormData) {
  const tokenHash = tokenHashFrom(formData);
  if (!tokenHash) redirect(authError("confirmation", "missing-credentials"));

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (error) redirect(authError("confirmation", "confirmation"));

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect(authError("confirmation", "session"));
  }

  redirect("/onboarding");
}

/**
 * Valida o token de recuperação e cria a sessão temporária que autoriza a troca
 * de senha. A senha só é alterada na etapa seguinte, em /update-password.
 */
export async function beginRecoveryAction(formData: FormData) {
  const tokenHash = tokenHashFrom(formData);
  if (!tokenHash) redirect(authError("recovery", "missing-credentials"));

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (error) redirect(authError("recovery", "confirmation"));

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect(authError("recovery", "recovery-session"));
  }

  redirect("/update-password");
}
