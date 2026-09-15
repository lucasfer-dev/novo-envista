"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/require-admin";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function brazilDateTime(value: string) {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createCalendarEventAdminAction(formData: FormData) {
  const { supabase, userId } = await requireAdminUser();
  const title = text(formData, "title", 160);
  const description = text(formData, "description", 3000);
  const location = text(formData, "location", 180);
  const href = text(formData, "href", 500) || "/calendar";
  const kindRaw = text(formData, "kind", 20);
  const audienceRaw = text(formData, "audience", 20);
  const startsAt = brazilDateTime(text(formData, "starts_at", 32));
  const endsAt = brazilDateTime(text(formData, "ends_at", 32));
  const kind = ["event", "announcement", "competition", "deadline"].includes(kindRaw) ? kindRaw : "event";
  const audience = ["all", "participant", "investor"].includes(audienceRaw) ? audienceRaw : "all";
  const isPublished = formData.get("is_published") === "on";

  if (title.length < 2 || !startsAt || !href.startsWith("/") || href.startsWith("//") || (endsAt && new Date(endsAt) < new Date(startsAt))) {
    redirect("/admin/calendar?error=invalid");
  }

  const { error } = await supabase.from("platform_calendar_events").insert({
    title,
    description,
    location,
    href,
    kind,
    audience,
    starts_at: startsAt,
    ends_at: endsAt,
    is_published: isPublished,
    created_by: userId,
  });
  if (error) redirect("/admin/calendar?error=save");

  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  revalidatePath("/investor/calendar");
  redirect("/admin/calendar?status=created");
}

export async function toggleCalendarEventAdminAction(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const eventId = text(formData, "event_id", 80);
  const next = formData.get("publish") === "true";
  if (!eventId) redirect("/admin/calendar?error=invalid");

  const { error } = await supabase.from("platform_calendar_events").update({ is_published: next, updated_at: new Date().toISOString() }).eq("id", eventId);
  if (error) redirect("/admin/calendar?error=save");
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  revalidatePath("/investor/calendar");
  redirect("/admin/calendar?status=updated");
}

export async function deleteCalendarEventAdminAction(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const eventId = text(formData, "event_id", 80);
  if (!eventId) redirect("/admin/calendar?error=invalid");

  const { error } = await supabase.from("platform_calendar_events").delete().eq("id", eventId);
  if (error) redirect("/admin/calendar?error=delete");
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  revalidatePath("/investor/calendar");
  redirect("/admin/calendar?status=deleted");
}
