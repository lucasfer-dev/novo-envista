"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, name: string, max = 500) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

async function currentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");
  return { supabase, userId };
}

function safeUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

export async function updateProfessionalProfileAction(formData: FormData) {
  const { supabase, userId } = await currentUser();
  const headline = text(formData, "headline", 140);
  const githubUrl = safeUrl(text(formData, "github_url", 500));
  const linkedinUrl = safeUrl(text(formData, "linkedin_url", 500));
  const websiteUrl = safeUrl(text(formData, "website_url", 500));
  const skills = text(formData, "skills", 500)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((item) => item.slice(0, 40));

  const { error } = await supabase.from("profiles").update({
    headline: headline || null,
    github_url: githubUrl,
    linkedin_url: linkedinUrl,
    website_url: websiteUrl,
    skills,
  }).eq("id", userId);
  if (error) redirect("/account/professional?error=save");
  revalidatePath("/account/professional");
  redirect("/account/professional?status=saved");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const { supabase, userId } = await currentUser();
  const payload = {
    user_id: userId,
    social: checked(formData, "social"),
    teams: checked(formData, "teams"),
    projects: checked(formData, "projects"),
    messages: checked(formData, "messages"),
    investor_activity: checked(formData, "investor_activity"),
    saved_project_updates: checked(formData, "saved_project_updates"),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("notification_preferences").upsert(payload, { onConflict: "user_id" });
  if (error) redirect("/account/settings?error=preferences");
  revalidatePath("/account/settings");
  redirect("/account/settings?status=saved");
}

export async function signOutEverywhereAction() {
  const { supabase } = await currentUser();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?status=signed-out-everywhere");
}

export async function submitFeedbackAction(formData: FormData) {
  const { supabase, userId } = await currentUser();
  const categoryRaw = text(formData, "category", 20);
  const category = ["feedback", "bug", "idea", "support"].includes(categoryRaw) ? categoryRaw : "feedback";
  const message = text(formData, "message", 3000);
  const pagePathRaw = text(formData, "page_path", 500);
  const pagePath = pagePathRaw.startsWith("/") ? pagePathRaw : "/";
  if (message.length < 5) redirect("/account/feedback?error=message");
  const { error } = await supabase.from("feedback_tickets").insert({ user_id: userId, category, message, page_path: pagePath });
  if (error) redirect("/account/feedback?error=save");
  revalidatePath("/account/feedback");
  redirect("/account/feedback?status=sent");
}
