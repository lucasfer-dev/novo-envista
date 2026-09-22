import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/schools", "/projects", "/p/"],
        disallow: [
          "/app/",
          "/investor/",
          "/admin/",
          "/account/",
          "/auth/",
          "/api/",
          "/login",
          "/register",
          "/onboarding",
          "/guardian-required",
          "/forgot-password",
          "/recover-account",
          "/update-password",
        ],
      },
    ],
    sitemap: "https://useenvista.com.br/sitemap.xml",
    host: "https://useenvista.com.br",
  };
}
