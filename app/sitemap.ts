import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: "https://useenvista.com.br/", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "https://useenvista.com.br/about", lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://useenvista.com.br/schools", lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://useenvista.com.br/terms", lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: "https://useenvista.com.br/privacy", lastModified, changeFrequency: "monthly", priority: 0.3 },
  ];
}
