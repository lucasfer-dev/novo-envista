function requirePublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} não configurada.`);
  }

  return value;
}

/**
 * A aplicação usa apenas a chave publishable no browser e no cliente SSR.
 * Chaves administrativas/service-role nunca devem passar por este módulo.
 */
export function getSupabaseConfig() {
  const url = requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requirePublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL deve usar HTTPS.");
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY deve conter somente uma chave publishable do Supabase.",
    );
  }

  return { url, publishableKey } as const;
}
