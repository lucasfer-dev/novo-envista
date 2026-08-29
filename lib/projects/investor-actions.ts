"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { safeInternalPath } from "@/lib/auth/validation";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function returnPath(formData: FormData) {
  return safeInternalPath(formData.get("return_to"), "/investor");
}

function withQuery(path: string, query: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

export async function toggleProjectSaveAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const projectId = text(formData, "project_id", 80);
  const returnTo = returnPath(formData);
  if (!projectId) redirect(withQuery(returnTo, "error=save"));

  const { data: existing, error: lookupError } = await supabase
    .from("project_saves")
    .select("project_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (lookupError) redirect(withQuery(returnTo, "error=save"));

  if (existing) {
    const { error } = await supabase
      .from("project_saves")
      .delete()
      .eq("user_id", userId)
      .eq("project_id", projectId);
    if (error) redirect(withQuery(returnTo, "error=save"));
  } else {
    const { data: saved, error } = await supabase
      .from("project_saves")
      .insert({ user_id: userId, project_id: projectId })
      .select("project_id")
      .single();
    if ((error && error.code !== "23505") || (!saved && !error)) redirect(withQuery(returnTo, "error=save"));
  }

  revalidatePath("/investor");
  revalidatePath("/investor/saved");
  revalidatePath(returnTo.split("?")[0]);
  redirect(returnTo);
}

export async function sendProjectInterestAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const projectId = text(formData, "project_id", 80);
  const message = text(formData, "message", 1200);
  const returnTo = returnPath(formData);
  if (!projectId) redirect(withQuery(returnTo, "error=interest"));

  const { data: interest, error } = await supabase.from("project_interests").upsert(
    {
      investor_id: userId,
      project_id: projectId,
      message,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "investor_id,project_id" },
  ).select("project_id").single();

  if (error || !interest) redirect(withQuery(returnTo, "error=interest"));
  revalidatePath("/investor");
  revalidatePath(returnTo.split("?")[0]);
  redirect(withQuery(returnTo, "status=interest"));
}
