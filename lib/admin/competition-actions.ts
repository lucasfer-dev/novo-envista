"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/require-admin";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function optionalDate(formData: FormData, name: string) {
  const raw = text(formData, name, 40);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function optionalPositiveInt(formData: FormData, name: string) {
  const raw = text(formData, name, 10);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(1, Math.min(10000, Math.trunc(value)));
}

async function audit(
  supabase: any,
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("admin_audit_log").insert({
    admin_user_id: userId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

function competitionPayload(formData: FormData) {
  const title = text(formData, "title", 160);
  const slug = slugify(text(formData, "slug", 120) || title);
  const statusRaw = text(formData, "status", 20);
  const status = ["draft", "published", "closed", "archived"].includes(statusRaw)
    ? statusRaw
    : "draft";

  return {
    title,
    slug,
    summary: text(formData, "summary", 500),
    description: text(formData, "description", 12000),
    organizer: text(formData, "organizer", 160) || "Envista",
    location: text(formData, "location", 220),
    format: text(formData, "format", 120),
    status,
    registration_opens_at: optionalDate(formData, "registration_opens_at"),
    registration_closes_at: optionalDate(formData, "registration_closes_at"),
    starts_at: optionalDate(formData, "starts_at"),
    ends_at: optionalDate(formData, "ends_at"),
    max_teams: optionalPositiveInt(formData, "max_teams"),
    rules: text(formData, "rules", 20000),
    prize: text(formData, "prize", 3000),
  };
}

export async function createCompetitionAdminAction(formData: FormData) {
  const { supabase, userId } = await requireAdminUser();
  const payload = competitionPayload(formData);
  if (!payload.title || !payload.slug) redirect("/admin/competitions/new?error=invalid");

  const { data, error } = await supabase
    .from("competitions")
    .insert({ ...payload, created_by: userId })
    .select("id")
    .single();

  if (error || !data) redirect("/admin/competitions/new?error=save");
  await audit(supabase, userId, "competition.create", "competition", data.id, { status: payload.status });
  revalidatePath("/admin");
  revalidatePath("/admin/competitions");
  redirect(`/admin/competitions/${data.id}?status=created`);
}

export async function updateCompetitionAdminAction(formData: FormData) {
  const { supabase, userId } = await requireAdminUser();
  const competitionId = text(formData, "competition_id", 80);
  const payload = competitionPayload(formData);
  if (!competitionId || !payload.title || !payload.slug) redirect("/admin/competitions?error=invalid");

  const { error } = await supabase.from("competitions").update(payload).eq("id", competitionId);
  if (error) redirect(`/admin/competitions/${competitionId}?error=save`);

  await audit(supabase, userId, "competition.update", "competition", competitionId, { status: payload.status });
  revalidatePath("/admin");
  revalidatePath("/admin/competitions");
  revalidatePath(`/admin/competitions/${competitionId}`);
  redirect(`/admin/competitions/${competitionId}?status=saved`);
}

export async function registerTeamCompetitionAdminAction(formData: FormData) {
  const { supabase, userId } = await requireAdminUser();
  const competitionId = text(formData, "competition_id", 80);
  const teamId = text(formData, "team_id", 80);
  const note = text(formData, "note", 1000);
  if (!competitionId || !teamId) redirect("/admin/competitions?error=registration");

  const { error } = await supabase.from("competition_team_registrations").insert({
    competition_id: competitionId,
    team_id: teamId,
    registered_by: userId,
    note,
  });

  if (error) redirect(`/admin/competitions/${competitionId}?error=registration`);
  await audit(supabase, userId, "competition.team.register", "team", teamId, { competition_id: competitionId });
  revalidatePath("/admin/competitions");
  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/competitions/${competitionId}?status=team-registered`);
}

export async function unregisterTeamCompetitionAdminAction(formData: FormData) {
  const { supabase, userId } = await requireAdminUser();
  const competitionId = text(formData, "competition_id", 80);
  const teamId = text(formData, "team_id", 80);
  if (!competitionId || !teamId) redirect("/admin/competitions?error=registration");

  const { error } = await supabase
    .from("competition_team_registrations")
    .delete()
    .eq("competition_id", competitionId)
    .eq("team_id", teamId);

  if (error) redirect(`/admin/competitions/${competitionId}?error=registration`);
  await audit(supabase, userId, "competition.team.unregister", "team", teamId, { competition_id: competitionId });
  revalidatePath("/admin/competitions");
  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/competitions/${competitionId}?status=team-unregistered`);
}
