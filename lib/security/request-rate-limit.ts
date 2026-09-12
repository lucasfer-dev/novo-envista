import { NextResponse, type NextRequest } from "next/server";

type Bucket = {
  count: number;
  windowStart: number;
  lastSeen: number;
};

type Policy = {
  scope: string;
  limit: number;
  windowMs: number;
};

const globalStore = globalThis as typeof globalThis & {
  __envistaRateLimitStore?: Map<string, Bucket>;
};

const buckets = (globalStore.__envistaRateLimitStore ??= new Map<string, Bucket>());
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const protectedGetPaths = new Set(["/api/competitions"]);

function clientIp(request: NextRequest) {
  // A Vercel sobrescreve x-forwarded-for na borda. Fora da Vercel usamos um
  // identificador local, já que este limitador é apenas a primeira camada.
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "local";
}

function policyForRequest(request: NextRequest): Policy {
  const pathname = request.nextUrl.pathname;
  if (request.method === "GET" && pathname === "/api/competitions") {
    return { scope: "competitions-read", limit: 60, windowMs: 60_000 };
  }
  if (pathname === "/login" || pathname === "/admin/login") {
    return { scope: "login", limit: 10, windowMs: 60_000 };
  }
  if (pathname === "/register") {
    return { scope: "register", limit: 5, windowMs: 10 * 60_000 };
  }
  if (pathname === "/forgot-password") {
    return { scope: "password-reset", limit: 5, windowMs: 15 * 60_000 };
  }
  return { scope: "unsafe", limit: 120, windowMs: 60_000 };
}

function cleanup(now: number) {
  if (buckets.size < 10_000) return;

  for (const [key, bucket] of buckets) {
    if (now - bucket.lastSeen > 2 * 60 * 60_000) buckets.delete(key);
  }

  if (buckets.size <= 10_000) return;
  const oldest = [...buckets.entries()]
    .sort((a, b) => a[1].lastSeen - b[1].lastSeen)
    .slice(0, 1_000);
  for (const [key] of oldest) buckets.delete(key);
}

function sameOrigin(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

function denied(status: 403 | 429, retryAfter?: number) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);

  return NextResponse.json(
    {
      error:
        status === 429
          ? "Muitas requisições. Aguarde um pouco e tente novamente."
          : "Origem da requisição não permitida.",
    },
    { status, headers },
  );
}

/**
 * Proteção best-effort na borda.
 *
 * Não substitui as quotas atômicas no Supabase: instâncias serverless podem ter
 * memória separada. A função reduz rajadas, brute force e CSRF antes de o request
 * chegar às Server Actions. GETs caros explicitamente listados também recebem
 * limitação por IP; o banco continua sendo a camada autoritativa para abuso que
 * precisa de coordenação global.
 */
export function guardUnsafeRequest(request: NextRequest) {
  const method = request.method.toUpperCase();
  const isUnsafe = unsafeMethods.has(method);
  const isProtectedGet = method === "GET" && protectedGetPaths.has(request.nextUrl.pathname);

  if (!isUnsafe && !isProtectedGet) return null;
  if (isUnsafe && !sameOrigin(request)) return denied(403);

  const policy = policyForRequest(request);
  const now = Date.now();
  cleanup(now);

  const key = `${policy.scope}:${clientIp(request)}`;
  const current = buckets.get(key);
  if (!current || now - current.windowStart >= policy.windowMs) {
    buckets.set(key, { count: 1, windowStart: now, lastSeen: now });
    return null;
  }

  current.lastSeen = now;
  if (current.count >= policy.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.windowStart + policy.windowMs - now) / 1_000));
    return denied(429, retryAfter);
  }

  current.count += 1;
  return null;
}
