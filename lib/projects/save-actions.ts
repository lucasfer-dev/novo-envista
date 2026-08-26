"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

function value(formData: FormData, name: string, max = 300) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function safeReturnTo(raw: string) {
  return raw.startsWith("/investor/") || raw === "/investor" ? raw : "/investor/explore";
}

export async function toggleProjectSaveAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const projectId = value(formData, "project_id", 80);
  const returnTo = safeReturnTo(value(formData, "return_to", 300));
  if (!projectId) redirect(returnTo);

  const { data: existing } = await supabase
    .from("project_saves")
    .select("project_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    await supabase.from("project_saves").delete().eq("user_id", userId).eq("project_id", projectId);
  } else {
    await supabase.from("project_saves").insert({ user_id: userId, project_id: projectId });
  }

  revalidatePath("/investor");
  revalidatePath("/investor/saved");
  revalidatePath(returnTo);
  redirect(returnTo);
}
