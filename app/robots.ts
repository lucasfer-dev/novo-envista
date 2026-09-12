import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/schools", "/terms", "/privacy"],
        disallow: ["/app/", "/investor/", "/admin/", "/account/", "/auth/", "/login", "/register", "/onboarding", "/forgot-password", "/recover-account", "/update-password"],
      },
    ],
    sitemap: "https://useenvista.com.br/sitemap.xml",
  };
}
