/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";

// Content-Security-Policy is generated per request in proxy.ts because a nonce
// must never be reused between responses. Static security headers remain here.
const securityHeaders = [
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
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
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
        "/confirm-email",
        "/recover-account",
        "/update-password",
        "/onboarding",
        "/guardian-required",
        "/admin-mfa",
        "/auth/:path*",
        "/account/:path*",
        "/admin/:path*",
        "/app/:path*",
        "/investor/:path*",
      ].map((source) => ({ source, headers: sensitiveHeaders })),
    ];
  },
};

export default nextConfig;
