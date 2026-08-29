"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { safeInternalPath } from "@/lib/auth/validation";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function root(role: "participant" | "investor") {
  return role === "investor" ? "/investor/notifications" : "/app/notifications";
}

export async function openNotificationAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const id = text(formData, "notification_id", 80);
  const href = safeInternalPath(formData.get("href"), base);
  if (id) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  }
  revalidatePath(base);
  redirect(href);
}

export async function markAllNotificationsReadAction() {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  if (error) redirect(`${base}?error=read`);
  revalidatePath(base);
  redirect(`${base}?status=read`);
}

export async function deleteNotificationAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const id = text(formData, "notification_id", 80);
  if (!id) redirect(`${base}?error=delete`);
  const { error } = await supabase.from("notifications").delete().eq("id", id).eq("user_id", userId);
  if (error) redirect(`${base}?error=delete`);
  revalidatePath(base);
  redirect(base);
}
