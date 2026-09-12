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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code")?.trim() ?? "";
  const tokenHash = params.get("token_hash")?.trim() ?? "";
  const type = parseOtpType(params.get("type"));
  const next = safeInternalPath(params.get("next"), defaultDestination(type));
  const flow = flowFor(type, next);

  if (params.get("error") || params.get("error_code")) {
    return errorRedirect(request, "provider", flow);
  }

  if (code && tokenHash) return errorRedirect(request, "ambiguous-credentials", flow);

  // Keep signup/confirmation and recovery credentials untouched during GET so
  // Safe Links, previews and mail scanners cannot consume one-time credentials.
  if ((code || tokenHash) && (flow === "recovery" || flow === "confirmation")) {
    const target = request.nextUrl.clone();
    target.pathname = flow === "recovery" ? "/recover-account" : "/confirm-email";
    target.search = "";
    if (code) target.searchParams.set("code", code.slice(0, 2048));
    if (tokenHash) target.searchParams.set("token_hash", tokenHash.slice(0, 2048));
    if (type === "email" || type === "recovery") target.searchParams.set("type", type);
    else if (tokenHash) return errorRedirect(request, "invalid-type", flow);
    return NextResponse.redirect(target);
  }

  // Preserve compatibility for non-signup/non-recovery legacy flows.
  const supabase = await createClient({ requireCookieWrites: true });
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
