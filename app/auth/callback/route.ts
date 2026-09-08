import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/validation";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
  "signup",
]);

function parseOtpType(value: string | null): EmailOtpType | null {
  if (!value || !EMAIL_OTP_TYPES.has(value as EmailOtpType)) return null;
  return value as EmailOtpType;
}

function defaultDestination(type: EmailOtpType | null) {
  if (type === "recovery") return "/update-password";
  if (type === "email_change") return "/account/profile?status=email-updated";
  return "/onboarding";
}

function flowFor(type: EmailOtpType | null, next: string) {
  if (type === "recovery" || next.startsWith("/update-password")) return "recovery";
  if (type === "email_change") return "email-change";
  return "confirmation";
}

function errorRedirect(request: NextRequest, reason: string, flow: string) {
  const target = request.nextUrl.clone();
  target.pathname = "/auth/error";
  target.search = "";
  target.searchParams.set("reason", reason);
  target.searchParams.set("flow", flow);
  return NextResponse.redirect(target);
}

/**
 * Callback central dos e-mails do Supabase.
 *
 * Suporta os dois formatos usados pelos templates/fluxos de Auth:
 * - PKCE: `?code=...` (ConfirmationURL + redirect_to);
 * - token hash: `?token_hash=...&type=...` (template SSR customizado).
 *
 * Isso evita que uma alteração de template no Dashboard quebre cadastro ou
 * recuperação de senha desde que o link continue apontando para esta rota.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = parseOtpType(params.get("type"));
  const next = safeInternalPath(params.get("next"), defaultDestination(type));
  const flow = flowFor(type, next);

  // O Supabase pode devolver erros do Auth no próprio redirect.
  // Não refletimos descrição/token no HTML para evitar vazamento de detalhes.
  if (params.get("error") || params.get("error_code")) {
    return errorRedirect(request, "provider", flow);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return errorRedirect(request, "exchange", flow);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return errorRedirect(request, "confirmation", flow);
  } else {
    return errorRedirect(request, "missing-credentials", flow);
  }

  const target = request.nextUrl.clone();
  target.pathname = next;
  target.search = "";
  return NextResponse.redirect(target);
}
