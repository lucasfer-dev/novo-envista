"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TARGETS = new Set(["profile", "post", "project", "team"]);
const REASONS = new Set(["spam", "harassment", "impersonation", "unsafe", "privacy", "misleading", "other"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function field(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeReturnTo(value: string) {
  if (value === "/app" || value.startsWith("/app/") || value === "/investor" || value.startsWith("/investor/")) {
    return value;
  }
  return "/app";
}

function withStatus(path: string, status: "sent" | "exists" | "error") {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}report=${status}`;
}

export async function createContentReportAction(formData: FormData) {
  const targetType = field(formData, "target_type", 20);
  const targetId = field(formData, "target_id", 80);
  const reason = field(formData, "reason", 30);
  const details = field(formData, "details", 2000);
  const returnTo = safeReturnTo(field(formData, "return_to", 500));

  if (!TARGETS.has(targetType) || !UUID.test(targetId) || !REASONS.has(reason)) {
    redirect(withStatus(returnTo, "error"));
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/login");

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: auth.user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details,
    status: "open",
    admin_note: "",
  });

  if (error) {
    if (error.code === "23505") redirect(withStatus(returnTo, "exists"));
    redirect(withStatus(returnTo, "error"));
  }

  revalidatePath(returnTo.split("?")[0]);
  redirect(withStatus(returnTo, "sent"));
}
