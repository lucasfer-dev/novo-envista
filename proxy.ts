import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { guardUnsafeRequest } from "@/lib/security/request-rate-limit";

function createNonce() {
  // UUID v4 supplies cryptographically secure randomness. Removing separators
  // leaves a CSP nonce value that is safe to place directly in a header.
  return crypto.randomUUID().replaceAll("-", "");
}

function contentSecurityPolicy(nonce: string) {
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
    "https://challenges.cloudflare.com",
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function isSensitiveEmailAuthRoute(pathname: string) {
  return (
    pathname === "/confirm-email" ||
    pathname === "/recover-account" ||
    pathname === "/auth/callback" ||
    pathname === "/auth/confirm"
  );
}

function applySecurityHeaders(response: Response, request: NextRequest, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  if (isSensitiveEmailAuthRoute(request.nextUrl.pathname)) {
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

function legacyRootEmailRedirect(request: NextRequest, csp: string) {
  if (request.nextUrl.pathname !== "/") return null;
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) return null;

  const target = request.nextUrl.clone();
  target.pathname = "/recover-account";
  target.search = "";
  target.searchParams.set("token_hash", tokenHash);

  const response = NextResponse.redirect(target);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return applySecurityHeaders(response, request, csp);
}

export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const rootEmailRedirect = legacyRootEmailRedirect(request, csp);
  if (rootEmailRedirect) return rootEmailRedirect;

  const securityResponse = guardUnsafeRequest(request);
  if (securityResponse) return applySecurityHeaders(securityResponse, request, csp);

  const response = await updateSession(request, requestHeaders);
  return applySecurityHeaders(response, request, csp);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
