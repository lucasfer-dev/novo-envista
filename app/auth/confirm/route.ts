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
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = parseOtpType(request.nextUrl.searchParams.get("type"));
  const next = safeInternalPath(
    request.nextUrl.searchParams.get("next"),
    defaultDestination(type),
  );
  const target = request.nextUrl.clone();
  target.search = "";

  if (tokenHash && type) {
    const supabase = await createClient();
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
