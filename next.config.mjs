/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
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
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const sensitiveHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Os uploads reais vão direto ao Supabase Storage. As Server Actions desta
    // aplicação recebem apenas formulários pequenos, então reduzimos a área de
    // ataque de parsing de payloads muito grandes.
    serverActions: {
      bodySizeLimit: "256kb",
    },
  },
  // Mantém o Fast Refresh isolado do build de produção. Isso evita manifests
  // incompletos quando um build é executado enquanto o servidor local está ativo.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      ...[
        "/login",
        "/register",
        "/forgot-password",
        "/update-password",
        "/onboarding",
        "/guardian-required",
        "/auth/:path*",
        "/account/:path*",
        "/admin/:path*",
      ].map((source) => ({ source, headers: sensitiveHeaders })),
    ];
  },
};

export default nextConfig;
