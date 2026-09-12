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

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")?.trim() ?? "";
  const type = parseOtpType(request.nextUrl.searchParams.get("type"));
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"), defaultDestination(type));
  const target = request.nextUrl.clone();
  target.search = "";

  // Confirmation and password-recovery links must never be consumed by GET.
  // Mail scanners may follow this route before the user. Forward the credential
  // to the Envista landing page, where a Server Action performs verifyOtp.
  if (tokenHash && (type === "email" || type === "recovery")) {
    target.pathname = type === "recovery" ? "/recover-account" : "/confirm-email";
    target.searchParams.set("token_hash", tokenHash.slice(0, 2048));
    target.searchParams.set("type", type);
    return NextResponse.redirect(target);
  }

  // Compatibility for other legacy OTP types that are not part of the signup/
  // recovery templates audited here.
  if (tokenHash && type) {
    const supabase = await createClient({ requireCookieWrites: true });
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      target.pathname = next;
      return NextResponse.redirect(target);
    }
  }

  target.pathname = "/auth/error";
  target.searchParams.set("reason", "confirmation");
  target.searchParams.set(
    "flow",
    type === "recovery" || next.startsWith("/update-password") ? "recovery" : "confirmation",
  );
  return NextResponse.redirect(target);
}
