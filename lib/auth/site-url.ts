type SiteUrlEnv = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

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

/**
 * Resolve a URL base usada em links enviados por e-mail.
 *
 * Regra importante: um deploy da Vercel nunca deve gerar e-mail apontando para
 * localhost, mesmo que NEXT_PUBLIC_SITE_URL tenha sido configurada incorretamente.
 */
export function resolveSiteUrl(env: SiteUrlEnv = process.env) {
  const explicit = normalizeUrl(env.NEXT_PUBLIC_SITE_URL);
  const deploymentUrl = normalizeUrl(env.VERCEL_URL);
  const productionUrl = normalizeUrl(env.VERCEL_PROJECT_PRODUCTION_URL);
  const vercelEnvironment = env.VERCEL_ENV ?? env.VERCEL_TARGET_ENV;
  const onVercel = env.VERCEL === "1" || Boolean(vercelEnvironment);

  if (vercelEnvironment === "production") {
    if (explicit && !isLocalUrl(explicit)) return explicit;
    if (productionUrl && !isLocalUrl(productionUrl)) return productionUrl;
    if (deploymentUrl && !isLocalUrl(deploymentUrl)) return deploymentUrl;

    throw new Error("Não foi possível resolver uma URL pública para os e-mails de autenticação.");
  }

  if (vercelEnvironment === "preview" || onVercel) {
    if (deploymentUrl && !isLocalUrl(deploymentUrl)) return deploymentUrl;
    if (explicit && !isLocalUrl(explicit)) return explicit;
    if (productionUrl && !isLocalUrl(productionUrl)) return productionUrl;
  }

  if (explicit) return explicit;
  return "http://localhost:3000";
}
