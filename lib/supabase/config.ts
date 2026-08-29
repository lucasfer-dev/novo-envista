const DEFAULT_SUPABASE_URL = "https://yeqdalgzuutbputhjvwt.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cSr3SceabilO7-j-UO2aAQ_ZpIWlSgI";

type PublicSupabaseEnv = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

function publicValue(name: PublicSupabaseEnv, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

/**
 * A aplicação usa apenas a URL pública e a chave publishable do projeto Supabase.
 * Variáveis de ambiente continuam tendo prioridade para permitir rotação sem alterar código.
 * Os valores padrão abaixo são identificadores públicos do cliente web; nunca use
 * service_role, sb_secret_*, senha do banco ou qualquer credencial privilegiada aqui.
 */
export function getSupabaseConfig() {
  const url = publicValue("NEXT_PUBLIC_SUPABASE_URL", DEFAULT_SUPABASE_URL);
  const publishableKey = publicValue(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  );

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
