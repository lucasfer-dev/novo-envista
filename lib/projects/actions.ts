"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

const stages = new Set(["Ideia", "Validação", "Protótipo", "MVP", "Projeto ativo"]);

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
function tags(raw: string) {
  return Array.from(new Set(raw.split(",").map((x) => x.trim()).filter(Boolean).map((x) => x.slice(0, 40)))).slice(0, 10);
}
function base(role: "participant" | "investor") { return role === "investor" ? "/investor/projects" : "/app/projects"; }
function stage(formData: FormData) { const value = text(formData, "stage", 40); return stages.has(value) ? value : "Ideia"; }

export async function createProjectAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const title = text(formData, "title", 140);
  const destination = base(role);
  if (title.length < 2) redirect(`${destination}/new?error=title`);

  const owner = text(formData, "owner", 100);
  const personal = owner === "personal" || !owner;
  const ownerTeamId = personal ? null : owner;
  const ownerUserId = personal ? userId : null;
  if (ownerTeamId) {
    const { data: membership } = await supabase.from("team_members").select("team_id").eq("team_id", ownerTeamId).eq("user_id", userId).maybeSingle();
    if (!membership) redirect(`${destination}/new?error=owner`);
  }

  const slug = `${slugify(title) || "projeto"}-${randomUUID().slice(0, 8)}`.slice(0, 90);
  const { error } = await supabase.from("projects").insert({
    slug,
    title,
    short_description: text(formData, "short_description", 320),
    problem: text(formData, "problem", 4000),
    solution: text(formData, "solution", 4000),
    stage: stage(formData),
    category: text(formData, "category", 100),
    location: text(formData, "location", 160),
    tags: tags(text(formData, "tags", 700)),
    readme: text(formData, "readme", 20000),
    visibility: formData.get("visibility") === "private" ? "private" : "platform",
    owner_user_id: ownerUserId,
    owner_team_id: ownerTeamId,
    created_by: userId,
  });
  if (error) redirect(`${destination}/new?error=create`);
  revalidatePath(destination);
  redirect(`${destination}/${slug}?status=created`);
}

export async function updateProjectAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const id = text(formData, "project_id", 80);
  const slug = text(formData, "slug", 90);
  const title = text(formData, "title", 140);
  const destination = base(role);
  if (!id || !slug || title.length < 2) redirect(`${destination}/${slug}?error=invalid`);
  const { error } = await supabase.from("projects").update({
    title,
    short_description: text(formData, "short_description", 320),
    problem: text(formData, "problem", 4000),
    solution: text(formData, "solution", 4000),
    stage: stage(formData),
    category: text(formData, "category", 100),
    location: text(formData, "location", 160),
    tags: tags(text(formData, "tags", 700)),
    readme: text(formData, "readme", 20000),
    visibility: formData.get("visibility") === "private" ? "private" : "platform",
  }).eq("id", id);
  if (error) redirect(`${destination}/${slug}?error=save`);
  revalidatePath(`${destination}/${slug}`);
  revalidatePath(destination);
  redirect(`${destination}/${slug}?status=saved`);
}

export async function deleteProjectAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const id = text(formData, "project_id", 80);
  const destination = base(role);
  if (id) await supabase.from("projects").delete().eq("id", id);
  revalidatePath(destination);
  redirect(`${destination}?status=deleted`);
}
