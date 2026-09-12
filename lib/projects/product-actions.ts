"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductUser } from "@/lib/auth/require-product-user";

const stages = new Set(["Ideia", "Validação", "Protótipo", "MVP", "Projeto ativo"]);
const BASE = "/app/projects";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function list(raw: string, maxItems = 10) {
  return Array.from(new Set(raw.split(",").map((item) => item.trim()).filter(Boolean).map((item) => item.slice(0, 80)))).slice(0, maxItems);
}
function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
function stage(formData: FormData) {
  const value = text(formData, "stage", 40);
  return stages.has(value) ? value : "Ideia";
}
function safeUrl(value: string) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString().slice(0, 500) : "";
  } catch {
    return "";
  }
}

async function resolveOwner(supabase: any, userId: string, formData: FormData) {
  const owner = text(formData, "owner", 100);
  if (!owner || owner === "personal") return { owner_user_id: userId, owner_team_id: null };
  const { data: membership } = await supabase.from("team_members").select("team_id").eq("team_id", owner).eq("user_id", userId).maybeSingle();
  if (!membership) return null;
  return { owner_user_id: null, owner_team_id: owner };
}

export async function createProductProjectAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const title = text(formData, "title", 140);
  if (title.length < 2) redirect(`${BASE}/new?error=title`);
  const owner = await resolveOwner(supabase, userId, formData);
  if (!owner) redirect(`${BASE}/new?error=owner`);

  const website = text(formData, "website_url", 500);
  const repository = text(formData, "repository_url", 500);
  if ((website && !safeUrl(website)) || (repository && !safeUrl(repository))) redirect(`${BASE}/new?error=url`);

  const slug = `${slugify(title) || "projeto"}-${randomUUID().slice(0, 8)}`.slice(0, 90);
  const { data: created, error } = await supabase.from("projects").insert({
    slug,
    title,
    short_description: text(formData, "short_description", 320),
    problem: text(formData, "problem", 4000),
    solution: text(formData, "solution", 4000),
    impact: text(formData, "impact", 4000),
    needs: list(text(formData, "needs", 1200), 10),
    stage: stage(formData),
    category: text(formData, "category", 100),
    location: text(formData, "location", 160),
    tags: list(text(formData, "tags", 700), 10),
    website_url: safeUrl(website),
    repository_url: safeUrl(repository),
    readme: text(formData, "readme", 20000),
    visibility: formData.get("visibility") === "private" ? "private" : "platform",
    ...owner,
    created_by: userId,
  }).select("id").single();

  if (error || !created) redirect(`${BASE}/new?error=create`);
  revalidatePath(BASE);
  revalidatePath("/app");
  redirect(`${BASE}/${slug}?status=created`);
}

export async function updateProductProjectAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const id = text(formData, "project_id", 80);
  const slug = text(formData, "slug", 90);
  const title = text(formData, "title", 140);
  if (!id || !slug || title.length < 2) redirect(`${BASE}/${slug}?error=invalid`);

  const website = text(formData, "website_url", 500);
  const repository = text(formData, "repository_url", 500);
  if ((website && !safeUrl(website)) || (repository && !safeUrl(repository))) redirect(`${BASE}/${slug}?error=url`);

  const { data: updated, error } = await supabase.from("projects").update({
    title,
    short_description: text(formData, "short_description", 320),
    problem: text(formData, "problem", 4000),
    solution: text(formData, "solution", 4000),
    impact: text(formData, "impact", 4000),
    needs: list(text(formData, "needs", 1200), 10),
    stage: stage(formData),
    category: text(formData, "category", 100),
    location: text(formData, "location", 160),
    tags: list(text(formData, "tags", 700), 10),
    website_url: safeUrl(website),
    repository_url: safeUrl(repository),
    readme: text(formData, "readme", 20000),
    visibility: formData.get("visibility") === "private" ? "private" : "platform",
  }).eq("id", id).select("id").maybeSingle();

  if (error || !updated) redirect(`${BASE}/${slug}?error=save`);
  revalidatePath(`${BASE}/${slug}`);
  revalidatePath(BASE);
  revalidatePath("/app");
  revalidatePath("/investor/explore");
  redirect(`${BASE}/${slug}?status=saved`);
}
