"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/require-admin";

const STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function updateContentReportAdminAction(formData: FormData) {
  const { supabase, userId } = await requireAdminUser();
  const reportId = text(formData, "report_id", 80);
  const status = text(formData, "status", 20);
  const adminNote = text(formData, "admin_note", 2000);

  if (!reportId || !STATUSES.has(status)) redirect("/admin/moderation?error=content-report");
  const resolvedAt = status === "resolved" || status === "dismissed" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("content_reports")
    .update({ status, admin_note: adminNote, resolved_at: resolvedAt })
    .eq("id", reportId)
    .select("id,target_type,target_id")
    .maybeSingle();

  if (error || !data) redirect("/admin/moderation?error=content-report");

  await supabase.from("admin_audit_log").insert({
    admin_user_id: userId,
    action: "content_report.update",
    target_type: "content_report",
    target_id: reportId,
    metadata: { status, reported_type: data.target_type, reported_id: data.target_id },
  });

  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?status=content-saved");
}
