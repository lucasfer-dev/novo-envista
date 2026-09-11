"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function credentialFrom(formData: FormData) {
  const rawTokenHash = formData.get("token_hash");
  const rawCode = formData.get("code");
  return {
    tokenHash: typeof rawTokenHash === "string" ? rawTokenHash.trim().slice(0, 2048) : "",
    code: typeof rawCode === "string" ? rawCode.trim().slice(0, 2048) : "",
  };
}

function authError(flow: "confirmation" | "recovery", reason: string) {
  return `/auth/error?reason=${encodeURIComponent(reason)}&flow=${flow}`;
}

async function establishSession(
  flow: "confirmation" | "recovery",
  tokenHash: string,
  code: string,
) {
  const supabase = await createClient();

  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: flow === "recovery" ? "recovery" : "email",
      })
    : await supabase.auth.exchangeCodeForSession(code);

  if (error) redirect(authError(flow, "confirmation"));

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect(authError(flow, flow === "recovery" ? "recovery-session" : "session"));
  }
}

/**
 * Consome o token de confirmação somente depois de uma ação explícita do usuário.
 * Isso evita que scanners/prefetchers de provedores de e-mail confirmem a conta
 * antes de o usuário abrir a página do Envista. O `code` continua aceito como
 * fallback para e-mails PKCE antigos já enviados antes deste fluxo existir.
 */
export async function confirmEmailAction(formData: FormData) {
  const { tokenHash, code } = credentialFrom(formData);
  if (!tokenHash && !code) redirect(authError("confirmation", "missing-credentials"));

  await establishSession("confirmation", tokenHash, code);
  redirect("/confirm-email?status=confirmed");
}

/**
 * Valida o token de recuperação e cria a sessão temporária que autoriza a troca
 * de senha. A senha só é alterada na etapa seguinte, em /update-password.
 * `code` mantém compatibilidade com links PKCE emitidos anteriormente.
 */
export async function beginRecoveryAction(formData: FormData) {
  const { tokenHash, code } = credentialFrom(formData);
  if (!tokenHash && !code) redirect(authError("recovery", "missing-credentials"));

  await establishSession("recovery", tokenHash, code);
  redirect("/update-password");
}
