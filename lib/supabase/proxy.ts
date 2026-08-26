import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseAuthCookieNames } from "@/lib/supabase/auth-cookie";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  // Visitantes sem cookie de sessão/PKCE não precisam instanciar Auth nem validar
  // claims. Quem possui sessão continua passando pelo refresh normal abaixo.
  if (!hasSupabaseAuthCookieNames(request.cookies.getAll().map(({ name }) => name))) {
    return NextResponse.next({ request });
  }

  const { url, publishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Valida a assinatura/claims e renova cookies quando necessário.
  await supabase.auth.getClaims();
  return response;
}
