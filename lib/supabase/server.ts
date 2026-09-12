import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logServerEvent } from "@/lib/observability/logger";
import { getSupabaseConfig } from "@/lib/supabase/config";

type CreateClientOptions = {
  requireCookieWrites?: boolean;
};

export async function createClient(options: CreateClientOptions = {}) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _cacheHeaders) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
            cookieStore.set(name, value, cookieOptions),
          );
        } catch (error) {
          logServerEvent(options.requireCookieWrites ? "error" : "warn", "auth.cookies.write_failed", {
            required: Boolean(options.requireCookieWrites),
            count: cookiesToSet.length,
            error_name: error instanceof Error ? error.name : "UnknownError",
          });

          // Server Components are read-only for cookies. That is acceptable for
          // passive session reads. Authentication exchanges explicitly request
          // writable cookies so they never report success when Set-Cookie cannot persist.
          // Cache headers from @supabase/ssr are handled by the Proxy response path.
          if (options.requireCookieWrites) throw error;
        }
      },
    },
  });
}
