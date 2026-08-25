/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mantém o Fast Refresh isolado do build de produção. Isso evita manifests
  // incompletos quando um build é executado enquanto o servidor local está ativo.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;

