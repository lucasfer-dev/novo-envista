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

export async function toggleProjectSaveAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const projectId = text(formData, "project_id", 80);
  const returnTo = returnPath(formData);
  if (!projectId) redirect(returnTo);

  const { data: existing } = await supabase
    .from("project_saves")
    .select("project_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("project_saves")
      .delete()
      .eq("user_id", userId)
      .eq("project_id", projectId);
  } else {
    const { error } = await supabase.from("project_saves").insert({
      user_id: userId,
      project_id: projectId,
    });
    if (error) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=save`);
  }

  revalidatePath("/investor");
  revalidatePath("/investor/saved");
  revalidatePath(returnTo.split("?")[0]);
  redirect(returnTo);
}

export async function sendProjectInterestAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const projectId = text(formData, "project_id", 80);
  const message = text(formData, "message", 2000);
  const returnTo = returnPath(formData);
  if (!projectId) redirect(returnTo);

  const { error } = await supabase.from("project_interests").upsert(
    {
      investor_id: userId,
      project_id: projectId,
      message,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "investor_id,project_id" },
  );

  if (error) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=interest`);
  revalidatePath(returnTo.split("?")[0]);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}status=interest`);
}
