type SiteUrlEnv = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

// Alias estável de rollback. NEXT_PUBLIC_SITE_URL continua tendo prioridade,
// portanto produção deve apontar explicitamente para https://useenvista.com.br.
export const ENVISTA_PRODUCTION_FALLBACK_URL = "https://envista-novo.vercel.app";

function normalizeUrl(value?: string) {
  const raw = value?.trim();
  if (!raw) return null;

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalUrl(value: string) {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function firstPublicUrl(...values: Array<string | null>) {
  return values.find((item): item is string => Boolean(item && !isLocalUrl(item))) ?? null;
}

/**
 * Resolve a URL base usada em links enviados por e-mail.
 *
 * Regras importantes:
 * - produção/preview na Vercel nunca pode gerar link para localhost;
 * - NEXT_PUBLIC_SITE_URL ganha prioridade e deve ser o domínio oficial;
 * - o alias estável envista-novo.vercel.app é fallback de rollback;
 * - localhost permanece permitido somente no desenvolvimento local.
 */
export function resolveSiteUrl(env: SiteUrlEnv = process.env) {
  const explicit = normalizeUrl(env.NEXT_PUBLIC_SITE_URL);
  const deploymentUrl = normalizeUrl(env.VERCEL_URL) ?? normalizeUrl(env.NEXT_PUBLIC_VERCEL_URL);
  const productionUrl = normalizeUrl(env.VERCEL_PROJECT_PRODUCTION_URL);
  const fallbackProductionUrl = normalizeUrl(ENVISTA_PRODUCTION_FALLBACK_URL)!;
  const vercelEnvironment = env.VERCEL_ENV ?? env.VERCEL_TARGET_ENV;
  const onVercel =
    env.VERCEL === "1" ||
    Boolean(vercelEnvironment) ||
    Boolean(deploymentUrl) ||
    Boolean(productionUrl);

  if (vercelEnvironment === "production") {
    return firstPublicUrl(explicit, productionUrl, deploymentUrl, fallbackProductionUrl) ?? fallbackProductionUrl;
  }

  if (vercelEnvironment === "preview") {
    return firstPublicUrl(deploymentUrl, explicit, productionUrl, fallbackProductionUrl) ?? fallbackProductionUrl;
  }

  if (onVercel) {
    return firstPublicUrl(deploymentUrl, explicit, productionUrl, fallbackProductionUrl) ?? fallbackProductionUrl;
  }

  if (explicit) return explicit;
  return "http://localhost:3000";
}
