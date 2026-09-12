import type { NextRequest } from "next/server";
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
    // Fallback for browsers that do not implement strict-dynamic. Modern
    // browsers trust Turnstile through the nonced Next.js script instead.
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

export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  // Next.js reads x-nonce during SSR and applies it to framework/script tags.
  // Sending the CSP to the request as well ensures the server render and browser
  // receive the exact same nonce for this one response.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const securityResponse = guardUnsafeRequest(request);
  if (securityResponse) {
    securityResponse.headers.set("Content-Security-Policy", csp);
    return securityResponse;
  }

  const response = await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
