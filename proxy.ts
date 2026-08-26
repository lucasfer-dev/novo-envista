import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { guardUnsafeRequest } from "@/lib/security/request-rate-limit";

export async function proxy(request: NextRequest) {
  const securityResponse = guardUnsafeRequest(request);
  if (securityResponse) return securityResponse;
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
