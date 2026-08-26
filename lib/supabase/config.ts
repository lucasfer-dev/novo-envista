const fallbackSupabaseUrl = "https://yeqdalgzuutbputhjvwt.supabase.co";
const fallbackSupabasePublishableKey = "sb_publishable_cSr3SceabilO7-j-UO2aAQ_ZpIWlSgI";

/**
 * Configuração pública do Supabase.
 *
 * NEXT_PUBLIC_* tem prioridade para permitir ambientes diferentes (local,
 * preview e produção). Os fallbacks pertencem ao projeto Envista e são
 * valores públicos por definição; nunca coloque service_role ou outras
 * chaves secretas neste arquivo.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  fallbackSupabasePublishableKey;
