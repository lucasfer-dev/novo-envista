import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { guardUnsafeRequest } from "@/lib/security/request-rate-limit";

const PARTICIPANT_ROUTE_ROOTS = new Set([
  "home",
  "learn",
  "social",
  "explore",
  "participants",
  "investors",
  "activity",
  "insights",
  "interests",
  "messages",
  "notifications",
  "settings",
  "teams",
  "projects",
  "workspace",
  "competitions",
  "calendar",
]);

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

function copySessionState(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie.name, cookie.value, cookie);
  }
  for (const header of ["Cache-Control", "Pragma", "Expires"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
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

function participantRouteResponse(
  request: NextRequest,
  requestHeaders: Headers,
  sessionResponse: NextResponse,
) {
  const pathname = request.nextUrl.pathname;

  // /projects is the public showcase. Keep the authenticated project area under
  // /app/projects so it cannot collide with the public route.
  if (pathname === "/app/projects" || pathname.startsWith("/app/projects/")) return null;

  // Old links keep working, but the browser is moved to the canonical URL.
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const target = request.nextUrl.clone();
    target.pathname = pathname === "/app" ? "/home" : pathname.slice(4) || "/home";
    return copySessionState(sessionResponse, NextResponse.redirect(target, 308));
  }

  if (pathname === "/projects") return null;

  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  if (!PARTICIPANT_ROUTE_ROOTS.has(firstSegment)) return null;

  // Keep the existing internal route tree while exposing clean participant URLs.
  const target = request.nextUrl.clone();
  target.pathname = pathname === "/home" ? "/app" : `/app${pathname}`;
  return copySessionState(
    sessionResponse,
    NextResponse.rewrite(target, { request: { headers: requestHeaders } }),
  );
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

  const sessionResponse = await updateSession(request, requestHeaders);
  const participantResponse = participantRouteResponse(
    request,
    requestHeaders,
    sessionResponse as NextResponse,
  );
  if (participantResponse) return applySecurityHeaders(participantResponse, request, csp);

  return applySecurityHeaders(sessionResponse, request, csp);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
