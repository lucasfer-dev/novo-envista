"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeReturnTo(raw: string) {
  return raw.startsWith("/investor/") || raw === "/investor" ? raw : "/investor/interests";
}

export async function expressProjectInterestAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const projectId = text(formData, "project_id", 80);
  const returnTo = safeReturnTo(text(formData, "return_to", 300));
  const message = text(formData, "message", 1200);
  if (!projectId) redirect(`${returnTo}?error=interest`);

  const { data: existing } = await supabase.from("project_interests").select("id,status").eq("investor_id", userId).eq("project_id", projectId).maybeSingle();
  const result = existing
    ? await supabase.from("project_interests").update({ message, status: "active" }).eq("id", existing.id)
    : await supabase.from("project_interests").insert({ investor_id: userId, project_id: projectId, message, status: "active" });
  if (result.error) redirect(`${returnTo}?error=interest`);

  revalidatePath("/investor");
  revalidatePath("/investor/interests");
  revalidatePath("/app/interests");
  revalidatePath(returnTo);
  redirect(`${returnTo}?status=interest-sent`);
}

export async function withdrawProjectInterestAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const projectId = text(formData, "project_id", 80);
  const returnTo = safeReturnTo(text(formData, "return_to", 300));
  if (projectId) await supabase.from("project_interests").update({ status: "withdrawn" }).eq("investor_id", userId).eq("project_id", projectId);
  revalidatePath("/investor/interests");
  revalidatePath("/app/interests");
  revalidatePath(returnTo);
  redirect(`${returnTo}?status=interest-withdrawn`);
}
