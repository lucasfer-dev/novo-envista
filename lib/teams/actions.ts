"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

const TEAMS_BASE = "/app/teams";

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
    .slice(0, 62);
}

function parseTags(raw: string) {
  return Array.from(new Set(raw.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.slice(0, 40)))).slice(0, 8);
}

export async function createTeamAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const name = text(formData, "name", 120);
  const description = text(formData, "description", 1200);
  const category = text(formData, "category", 100);
  const city = text(formData, "city", 100);
  const institution = text(formData, "institution", 160);
  const tags = parseTags(text(formData, "tags", 500));
  const visibility = formData.get("visibility") === "private" ? "private" : "platform";

  if (name.length < 2) redirect(`${TEAMS_BASE}/new?error=name`);
  const slugBase = slugify(name) || "equipe";
  const slug = `${slugBase}-${randomUUID().slice(0, 8)}`.slice(0, 80);

  const { data: created, error } = await supabase.from("teams").insert({
    slug,
    name,
    description,
    category,
    city,
    institution,
    tags,
    visibility,
    owner_id: userId,
  }).select("id").single();
  if (error || !created) redirect(`${TEAMS_BASE}/new?error=create`);
  revalidatePath(TEAMS_BASE);
  redirect(`${TEAMS_BASE}/${slug}?status=created`);
}

export async function updateTeamAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const teamId = text(formData, "team_id", 80);
  const slug = text(formData, "slug", 80);
  const name = text(formData, "name", 120);
  if (!teamId || !slug || name.length < 2) redirect(`${TEAMS_BASE}/${slug || ""}?error=invalid`);

  const { data: updated, error } = await supabase
    .from("teams")
    .update({
      name,
      description: text(formData, "description", 1200),
      category: text(formData, "category", 100),
      city: text(formData, "city", 100),
      institution: text(formData, "institution", 160),
      tags: parseTags(text(formData, "tags", 500)),
      visibility: formData.get("visibility") === "private" ? "private" : "platform",
    })
    .eq("id", teamId)
    .select("id")
    .maybeSingle();
  if (error || !updated) redirect(`${TEAMS_BASE}/${slug}?error=save`);
  revalidatePath(`${TEAMS_BASE}/${slug}`);
  redirect(`${TEAMS_BASE}/${slug}?status=saved`);
}

export async function inviteTeamMemberAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const teamId = text(formData, "team_id", 80);
  const slug = text(formData, "slug", 80);
  const username = text(formData, "username", 50).toLowerCase().replace(/^@/, "");
  const roleLabel = text(formData, "role_label", 80) || "Membro";
  const accessLevel = formData.get("access_level") === "admin" ? "admin" : "member";
  if (!teamId || !slug || !username) redirect(`${TEAMS_BASE}/${slug}?error=invite`);

  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .eq("role", "participant")
    .maybeSingle();
  if (!invitee || invitee.id === userId) redirect(`${TEAMS_BASE}/${slug}?error=member-not-found`);

  const { data: invitation, error } = await supabase.from("team_invitations").insert({
    team_id: teamId,
    invitee_id: invitee.id,
    invited_by: userId,
    role_label: roleLabel,
    access_level: accessLevel,
  }).select("id").single();
  if (error || !invitation) redirect(`${TEAMS_BASE}/${slug}?error=invite`);
  revalidatePath(`${TEAMS_BASE}/${slug}`);
  redirect(`${TEAMS_BASE}/${slug}?status=invited`);
}

export async function respondTeamInvitationAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const invitationId = text(formData, "invitation_id", 80);
  const response = formData.get("response") === "accepted" ? "accepted" : "declined";
  if (!invitationId) redirect(`${TEAMS_BASE}?error=invite-response`);
  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .update({ status: response })
    .eq("id", invitationId)
    .select("id")
    .maybeSingle();
  if (error || !invitation) redirect(`${TEAMS_BASE}?error=invite-response`);
  revalidatePath(TEAMS_BASE);
  redirect(`${TEAMS_BASE}?status=${response}`);
}

export async function cancelTeamInvitationAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const invitationId = text(formData, "invitation_id", 80);
  const slug = text(formData, "slug", 80);
  if (!invitationId || !slug) redirect(`${TEAMS_BASE}?error=invite-cancel`);
  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .select("id")
    .maybeSingle();
  if (error || !invitation) redirect(`${TEAMS_BASE}/${slug}?error=invite-cancel`);
  revalidatePath(`${TEAMS_BASE}/${slug}`);
  redirect(`${TEAMS_BASE}/${slug}?status=invite-cancelled`);
}

export async function removeTeamMemberAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const teamId = text(formData, "team_id", 80);
  const memberId = text(formData, "member_id", 80);
  const slug = text(formData, "slug", 80);
  if (!teamId || !memberId || !slug) redirect(`${TEAMS_BASE}?error=member-remove`);
  const { data: removed, error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", memberId)
    .select("user_id")
    .maybeSingle();
  if (error || !removed) redirect(`${TEAMS_BASE}/${slug}?error=member-remove`);
  revalidatePath(`${TEAMS_BASE}/${slug}`);
  redirect(`${TEAMS_BASE}/${slug}?status=member-removed`);
}

export async function leaveTeamAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const teamId = text(formData, "team_id", 80);
  if (!teamId) redirect(`${TEAMS_BASE}?error=leave`);
  const { data: membership, error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();
  if (error || !membership) redirect(`${TEAMS_BASE}?error=leave`);
  revalidatePath(TEAMS_BASE);
  redirect(`${TEAMS_BASE}?status=left`);
}

export async function deleteTeamAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const teamId = text(formData, "team_id", 80);
  if (!teamId) redirect(`${TEAMS_BASE}?error=delete`);
  const { data: deleted, error } = await supabase.from("teams").delete().eq("id", teamId).select("id").maybeSingle();
  if (error || !deleted) redirect(`${TEAMS_BASE}?error=delete`);
  revalidatePath(TEAMS_BASE);
  redirect(`${TEAMS_BASE}?status=deleted`);
}
