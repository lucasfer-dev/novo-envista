"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

function text(formData: FormData, name: string, max: number) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function safeHttps(raw: string) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

function back(slug: string, suffix = "") {
  return `/app/projects/${encodeURIComponent(slug)}/cockpit${suffix}`;
}

export async function updateProjectProfessionalLinksAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const projectId = text(formData, "project_id", 80);
  const slug = text(formData, "slug", 90);
  if (!projectId || !slug) redirect("/app/projects");
  const repositoryUrl = safeHttps(text(formData, "repository_url", 500));
  const demoUrl = safeHttps(text(formData, "demo_url", 500));
  const designUrl = safeHttps(text(formData, "design_url", 500));
  const { data, error } = await supabase.from("projects").update({ repository_url: repositoryUrl, demo_url: demoUrl, design_url: designUrl }).eq("id", projectId).select("id").maybeSingle();
  if (error || !data) redirect(back(slug, "?error=links"));
  revalidatePath(back(slug));
  redirect(back(slug, "?status=links"));
}

export async function createProjectMilestoneAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const projectId = text(formData, "project_id", 80);
  const slug = text(formData, "slug", 90);
  const title = text(formData, "title", 140);
  const description = text(formData, "description", 700);
  const dueDate = text(formData, "due_date", 20);
  if (!projectId || !slug || title.length < 2) redirect(back(slug, "?error=milestone"));
  const { error } = await supabase.from("project_milestones").insert({ project_id: projectId, created_by: userId, title, description, due_date: dueDate || null });
  if (error) redirect(back(slug, "?error=milestone"));
  revalidatePath(back(slug));
  redirect(back(slug, "?status=milestone"));
}

export async function toggleProjectMilestoneAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const milestoneId = text(formData, "milestone_id", 80);
  const slug = text(formData, "slug", 90);
  const complete = formData.get("complete") === "true";
  if (!milestoneId || !slug) redirect("/app/projects");
  const { error } = await supabase.from("project_milestones").update({ completed_at: complete ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", milestoneId);
  if (error) redirect(back(slug, "?error=milestone"));
  revalidatePath(back(slug));
  redirect(back(slug));
}

export async function deleteProjectMilestoneAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const milestoneId = text(formData, "milestone_id", 80);
  const slug = text(formData, "slug", 90);
  if (milestoneId) await supabase.from("project_milestones").delete().eq("id", milestoneId);
  revalidatePath(back(slug));
  redirect(back(slug));
}

export async function createProjectUpdateAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const projectId = text(formData, "project_id", 80);
  const slug = text(formData, "slug", 90);
  const title = text(formData, "title", 160);
  const body = text(formData, "body", 4000);
  if (!projectId || !slug || title.length < 2) redirect(back(slug, "?error=update"));
  const { error } = await supabase.from("project_updates").insert({ project_id: projectId, author_id: userId, title, body });
  if (error) redirect(back(slug, "?error=update"));
  revalidatePath(back(slug));
  redirect(back(slug, "?status=update"));
}

export async function deleteProjectUpdateAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const updateId = text(formData, "update_id", 80);
  const slug = text(formData, "slug", 90);
  if (updateId) await supabase.from("project_updates").delete().eq("id", updateId);
  revalidatePath(back(slug));
  redirect(back(slug));
}
