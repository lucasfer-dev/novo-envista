"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

const stages = new Set(["Ideia", "Validação", "Protótipo", "MVP", "Projeto ativo"]);
const PROJECTS_BASE = "/projects";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
function list(raw: string, maxItems = 10) {
  return Array.from(new Set(raw.split(",").map((x) => x.trim()).filter(Boolean).map((x) => x.slice(0, 80)))).slice(0, maxItems);
}
function stage(formData: FormData) { const value = text(formData, "stage", 40); return stages.has(value) ? value : "Ideia"; }
function webUrl(formData: FormData, name: string) {
  const raw = text(formData, name, 500);
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString().slice(0, 500) : "";
  } catch {
    return "";
  }
}

export async function createProjectAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const title = text(formData, "title", 140);
  if (title.length < 2) redirect(`${PROJECTS_BASE}/new?error=title`);

  const owner = text(formData, "owner", 100);
  const personal = owner === "personal" || !owner;
  const ownerTeamId = personal ? null : owner;
  const ownerUserId = personal ? userId : null;
  if (ownerTeamId) {
    const { data: membership } = await supabase.from("team_members").select("team_id").eq("team_id", ownerTeamId).eq("user_id", userId).maybeSingle();
    if (!membership) redirect(`${PROJECTS_BASE}/new?error=owner`);
  }

  const slug = `${slugify(title) || "projeto"}-${randomUUID().slice(0, 8)}`.slice(0, 90);
  const { data: created, error } = await supabase.from("projects").insert({
    slug,
    title,
    short_description: text(formData, "short_description", 320),
    problem: text(formData, "problem", 4000),
    solution: text(formData, "solution", 4000),
    impact: text(formData, "impact", 6000),
    stage: stage(formData),
    category: text(formData, "category", 100),
    location: text(formData, "location", 160),
    tags: list(text(formData, "tags", 900), 12),
    needs: list(text(formData, "needs", 1200), 20),
    readme: text(formData, "readme", 20000),
    website_url: webUrl(formData, "website_url"),
    repository_url: webUrl(formData, "repository_url"),
    demo_url: webUrl(formData, "demo_url") || null,
    design_url: webUrl(formData, "design_url") || null,
    visibility: formData.get("visibility") === "private" ? "private" : "platform",
    owner_user_id: ownerUserId,
    owner_team_id: ownerTeamId,
    created_by: userId,
  }).select("id").single();
  if (error || !created) redirect(`${PROJECTS_BASE}/new?error=create`);
  revalidatePath(PROJECTS_BASE);
  redirect(`${PROJECTS_BASE}/${slug}?status=created`);
}

export async function updateProjectAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const id = text(formData, "project_id", 80);
  const slug = text(formData, "slug", 90);
  const title = text(formData, "title", 140);
  if (!id || !slug || title.length < 2) redirect(`${PROJECTS_BASE}/${slug}?error=invalid`);
  const { data: updated, error } = await supabase.from("projects").update({
    title,
    short_description: text(formData, "short_description", 320),
    problem: text(formData, "problem", 4000),
    solution: text(formData, "solution", 4000),
    impact: text(formData, "impact", 6000),
    stage: stage(formData),
    category: text(formData, "category", 100),
    location: text(formData, "location", 160),
    tags: list(text(formData, "tags", 900), 12),
    needs: list(text(formData, "needs", 1200), 20),
    readme: text(formData, "readme", 20000),
    website_url: webUrl(formData, "website_url"),
    repository_url: webUrl(formData, "repository_url"),
    demo_url: webUrl(formData, "demo_url") || null,
    design_url: webUrl(formData, "design_url") || null,
    visibility: formData.get("visibility") === "private" ? "private" : "platform",
  }).eq("id", id).select("id").maybeSingle();
  if (error || !updated) redirect(`${PROJECTS_BASE}/${slug}?error=save`);
  revalidatePath(`${PROJECTS_BASE}/${slug}`);
  revalidatePath(PROJECTS_BASE);
  redirect(`${PROJECTS_BASE}/${slug}?status=saved`);
}

export async function deleteProjectAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const id = text(formData, "project_id", 80);
  if (!id) redirect(`${PROJECTS_BASE}?error=delete`);
  const { data: deleted, error } = await supabase.from("projects").delete().eq("id", id).select("id").maybeSingle();
  if (error || !deleted) redirect(`${PROJECTS_BASE}?error=delete`);
  revalidatePath(PROJECTS_BASE);
  redirect(`${PROJECTS_BASE}?status=deleted`);
}
