import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/validation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"), "/onboarding");
  const target = request.nextUrl.clone();
  target.search = "";

  if (!code) {
    target.pathname = "/auth/error";
    target.searchParams.set("reason", "missing-code");
    return NextResponse.redirect(target);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    target.pathname = "/auth/error";
    target.searchParams.set("reason", "exchange");
    return NextResponse.redirect(target);
  }

  target.pathname = next;
  return NextResponse.redirect(target);
}
