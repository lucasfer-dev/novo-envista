import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseProductRole } from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

function cleanQuery(value: string | null) {
  return (value ?? "").trim().replace(/[%_]/g, "").slice(0, 80);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ items: [] }, { status: 401 });

  const query = cleanQuery(new URL(request.url).searchParams.get("q"));
  if (query.length < 2) return NextResponse.json({ items: [] });

  const { data: ownProfile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = parseProductRole(ownProfile?.role);
  const prefix = role === "investor" ? "/investor" : "/app";
  const pattern = `%${query}%`;

  const [projectsResult, teamsResult, profilesResult, coursesResult] = await Promise.all([
    supabase.from("projects").select("id,slug,title,short_description,stage").ilike("title", pattern).limit(6),
    supabase.from("teams").select("id,slug,name,description,category").ilike("name", pattern).limit(6),
    supabase.from("profiles").select("id,username,display_name,bio,role").ilike("display_name", pattern).limit(6),
    role === "participant"
      ? supabase.from("courses").select("id,slug,title,description").ilike("title", pattern).eq("status", "published").limit(6)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
  ]);

  const items = [
    ...(projectsResult.data ?? []).map((item: any) => ({ id: item.id, type: "project" as const, title: item.title, subtitle: [item.stage, item.short_description].filter(Boolean).join(" · ") || "Projeto no Envista", href: `${prefix}/projects/${encodeURIComponent(item.slug)}?from=explore` })),
    ...(teamsResult.data ?? []).map((item: any) => ({ id: item.id, type: "team" as const, title: item.name, subtitle: [item.category, item.description].filter(Boolean).join(" · ") || "Equipe no Envista", href: `${prefix}/teams/${encodeURIComponent(item.slug)}?from=explore` })),
    ...(profilesResult.data ?? []).map((item: any) => ({ id: item.id, type: "profile" as const, title: item.display_name, subtitle: `@${item.username}${item.bio ? ` · ${item.bio}` : ""}`, href: `${prefix}/${item.role === "investor" ? "investors" : "participants"}/${encodeURIComponent(item.username)}` })),
    ...(coursesResult.data ?? []).map((item: any) => ({ id: item.id, type: "course" as const, title: item.title, subtitle: item.description || "Curso no Envista", href: `/app/learn/${encodeURIComponent(item.slug)}` })),
  ].slice(0, 20);

  return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
