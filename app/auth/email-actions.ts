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

  const result = tokenHash
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: flow === "recovery" ? "recovery" : "email",
      })
    : await supabase.auth.exchangeCodeForSession(code);

  if (result.error) {
    redirect(authError(flow, flow === "recovery" ? "recovery-token" : "confirmation"));
  }

  // verifyOtp/exchangeCodeForSession já devolvem a sessão autenticada e o
  // cliente SSR grava os cookies nessa mesma resposta. Não consulte getClaims
  // imediatamente depois de consumir um token de uso único: em um Server
  // Action isso pode observar o estado anterior dos cookies e transformar uma
  // validação bem-sucedida em erro, enquanto o token já ficou consumido.
  if (!result.data.session?.user?.id) {
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
 * Valida a credencial de recuperação a partir de uma ação explícita no Envista.
 * O GET de /recover-account nunca consome o token; isso evita que scanners de
 * e-mail invalidem o link antes do clique real do usuário.
 */
export async function establishRecoverySession(tokenHash: string, code: string) {
  const safeTokenHash = tokenHash.trim().slice(0, 2048);
  const safeCode = code.trim().slice(0, 2048);
  if (!safeTokenHash && !safeCode) redirect(authError("recovery", "missing-credentials"));

  await establishSession("recovery", safeTokenHash, safeCode);
}

/**
 * Compatibilidade com formulários/links antigos que ainda submetem manualmente
 * a etapa de recuperação.
 */
export async function beginRecoveryAction(formData: FormData) {
  const { tokenHash, code } = credentialFrom(formData);
  await establishRecoverySession(tokenHash, code);
  redirect("/update-password");
}
