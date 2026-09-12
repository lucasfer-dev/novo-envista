"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/require-admin";

export async function updateFeedbackTicketAdminAction(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const ticketId = typeof formData.get("ticket_id") === "string" ? String(formData.get("ticket_id")) : "";
  const rawStatus = typeof formData.get("status") === "string" ? String(formData.get("status")) : "";
  const status = ["open", "reviewing", "resolved", "closed"].includes(rawStatus) ? rawStatus : "reviewing";
  if (!ticketId) redirect("/admin/feedback?error=missing");
  const { error } = await supabase.from("feedback_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticketId);
  if (error) redirect("/admin/feedback?error=save");
  revalidatePath("/admin/feedback");
  redirect("/admin/feedback?status=saved");
}
