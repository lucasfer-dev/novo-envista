"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername, isValidUsername } from "@/lib/auth/validation";
import { BRAZIL_STATES } from "@/lib/brazil-locations";
import { logServerEvent } from "@/lib/observability/logger";

async function session() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");
  return { supabase, userId };
}
function field(data: FormData, key: string, maxLength: number) {
  const raw = data.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}
function url(value: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && parsed.hostname
      ? parsed.href.slice(0, 500)
      : null;
  } catch {
    return null;
  }
}
const settings = "/account/settings";
function errorPath(kind: string) { return settings + "?error=" + kind; }

export async function saveSettingsProfileAction(data: FormData) {
  const { supabase, userId } = await session();
  const username = normalizeUsername(data.get("username"));
  const displayName = field(data, "display_name", 100);
  if (!isValidUsername(username) || !displayName) redirect(errorPath("invalid"));

  const { data: compliance, error: complianceError } = await supabase
    .from("account_compliance")
    .select("age_band,guardian_required,guardian_consent_verified_at")
    .eq("user_id", userId).maybeSingle();
  if (complianceError || !compliance || compliance.age_band === "unknown") redirect("/onboarding");

  const state = field(data, "public_state", 2).toUpperCase();
  const stateValid = !state || BRAZIL_STATES.some(([code]) => code === state);
  if (!stateValid) redirect(errorPath("location"));
  const restricted = Boolean(compliance.guardian_required && !compliance.guardian_consent_verified_at);
  const visibility = restricted ? "private" : data.get("profile_visibility") === "platform" ? "platform" : "private";
  const messages = !restricted && data.get("allow_messages") === "on";

  const { data: updated, error } = await supabase.from("profiles").update({
    display_name: displayName,
    username,
    bio: field(data, "bio", 500) || null,
    public_city: state ? field(data, "public_city", 100) || null : null,
    public_state: state || null,
    profile_visibility: visibility,
    allow_messages: messages,
  }).eq("id", userId).select("id").maybeSingle();
  if (error || !updated) {
    logServerEvent("error", "settings.profile_save_failed", { code: error?.code || "no_row" });
    redirect(errorPath(error?.code === "23505" ? "username" : "save"));
  }
  revalidatePath(settings);
  revalidatePath("/account/profile");
  revalidatePath("/social");
  revalidatePath("/explore");
  redirect(settings + "?status=profile-saved");
}

export async function saveSettingsLinksAction(data: FormData) {
  const { supabase, userId } = await session();
  const entries = ["github_url", "linkedin_url", "website_url"] as const;
  const raw = entries.map((key) => field(data, key, 500));
  const validated = raw.map(url);
  if (raw.some((value, index) => value && !validated[index])) redirect(errorPath("url"));
  const { data: updated, error } = await supabase.from("profiles").update({
    github_url: validated[0],
    linkedin_url: validated[1],
    website_url: validated[2],
  }).eq("id", userId).select("id").maybeSingle();
  if (error || !updated) {
    logServerEvent("error", "settings.links_save_failed", { code: error?.code || "no_row" });
    redirect(errorPath("links"));
  }
  revalidatePath(settings);
  revalidatePath("/account/professional");
  redirect(settings + "?status=links-saved");
}

export async function removeSettingsAvatarAction() {
  const { supabase, userId } = await session();
  const { data: profile, error: readError } = await supabase
    .from("profiles").select("avatar_path").eq("id", userId).maybeSingle();
  if (readError || !profile) redirect(errorPath("avatar"));
  if (!profile.avatar_path) redirect(settings);
  const { data: updated, error } = await supabase.from("profiles").update({
    avatar_path: null,
  }).eq("id", userId).select("id").maybeSingle();
  if (error || !updated) {
    logServerEvent("error", "settings.avatar_remove_failed", { code: error?.code || "no_row" });
    redirect(errorPath("avatar"));
  }
  if (profile.avatar_path.startsWith(userId + "/")) {
    const { error: storageError } = await supabase.storage.from("avatars").remove([profile.avatar_path]);
    if (storageError) logServerEvent("warn", "settings.avatar_storage_cleanup_failed", { code: storageError.message });
  }
  revalidatePath(settings);
  revalidatePath("/account/profile");
  redirect(settings + "?status=avatar-removed");
}
