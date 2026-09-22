import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://useenvista.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/projects`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/schools`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/terms`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("slug,updated_at")
      .eq("visibility", "platform")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error || !data) return staticPages;

    const projectPages: MetadataRoute.Sitemap = data.map((project) => ({
      url: `${siteUrl}/p/${project.slug}`,
      lastModified: project.updated_at ? new Date(project.updated_at) : lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...projectPages];
  } catch {
    return staticPages;
  }
}
