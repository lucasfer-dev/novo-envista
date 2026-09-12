import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseAuthCookieNames } from "@/lib/supabase/auth-cookie";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest, requestHeaders = new Headers(request.headers)) {
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } });
  if (!hasSupabaseAuthCookieNames(request.cookies.getAll().map(({ name }) => name))) return nextResponse();

  const { url, publishableKey } = getSupabaseConfig();
  let response = nextResponse();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextResponse();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(cacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}
