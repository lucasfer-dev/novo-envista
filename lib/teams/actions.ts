"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

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

function safeRolePath(role: "participant" | "investor") {
  return role === "investor" ? "/investor/teams" : "/app/teams";
}

export async function createTeamAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const name = text(formData, "name", 120);
  const description = text(formData, "description", 1200);
  const category = text(formData, "category", 100);
  const city = text(formData, "city", 100);
  const institution = text(formData, "institution", 160);
  const tags = parseTags(text(formData, "tags", 500));
  const visibility = formData.get("visibility") === "private" ? "private" : "platform";
  const base = safeRolePath(role);

  if (name.length < 2) redirect(`${base}/new?error=name`);
  const slugBase = slugify(name) || "equipe";
  const slug = `${slugBase}-${randomUUID().slice(0, 8)}`.slice(0, 80);

  const { error } = await supabase.from("teams").insert({
    slug,
    name,
    description,
    category,
    city,
    institution,
    tags,
    visibility,
    owner_id: userId,
  });
  if (error) redirect(`${base}/new?error=create`);
  revalidatePath(base);
  redirect(`${base}/${slug}?status=created`);
}

export async function updateTeamAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const teamId = text(formData, "team_id", 80);
  const slug = text(formData, "slug", 80);
  const name = text(formData, "name", 120);
  const base = safeRolePath(role);
  if (!teamId || !slug || name.length < 2) redirect(`${base}/${slug || ""}?error=invalid`);

  const { error } = await supabase
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
    .eq("id", teamId);
  if (error) redirect(`${base}/${slug}?error=save`);
  revalidatePath(`${base}/${slug}`);
  redirect(`${base}/${slug}?status=saved`);
}

export async function inviteTeamMemberAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const teamId = text(formData, "team_id", 80);
  const slug = text(formData, "slug", 80);
  const username = text(formData, "username", 50).toLowerCase().replace(/^@/, "");
  const roleLabel = text(formData, "role_label", 80) || "Membro";
  const accessLevel = formData.get("access_level") === "admin" ? "admin" : "member";
  const base = safeRolePath(role);
  if (!teamId || !slug || !username) redirect(`${base}/${slug}?error=invite`);

  const { data: invitee } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (!invitee || invitee.id === userId) redirect(`${base}/${slug}?error=member-not-found`);

  const { error } = await supabase.from("team_invitations").insert({
    team_id: teamId,
    invitee_id: invitee.id,
    invited_by: userId,
    role_label: roleLabel,
    access_level: accessLevel,
  });
  if (error) redirect(`${base}/${slug}?error=invite`);
  revalidatePath(`${base}/${slug}`);
  redirect(`${base}/${slug}?status=invited`);
}

export async function respondTeamInvitationAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const invitationId = text(formData, "invitation_id", 80);
  const response = formData.get("response") === "accepted" ? "accepted" : "declined";
  const base = safeRolePath(role);
  if (!invitationId) redirect(base);
  await supabase.from("team_invitations").update({ status: response }).eq("id", invitationId);
  revalidatePath(base);
  redirect(`${base}?status=${response}`);
}

export async function cancelTeamInvitationAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const invitationId = text(formData, "invitation_id", 80);
  const slug = text(formData, "slug", 80);
  const base = safeRolePath(role);
  if (invitationId) await supabase.from("team_invitations").update({ status: "cancelled" }).eq("id", invitationId);
  revalidatePath(`${base}/${slug}`);
  redirect(`${base}/${slug}?status=invite-cancelled`);
}

export async function removeTeamMemberAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const teamId = text(formData, "team_id", 80);
  const memberId = text(formData, "member_id", 80);
  const slug = text(formData, "slug", 80);
  const base = safeRolePath(role);
  if (teamId && memberId) await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", memberId);
  revalidatePath(`${base}/${slug}`);
  redirect(`${base}/${slug}?status=member-removed`);
}

export async function leaveTeamAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const teamId = text(formData, "team_id", 80);
  const base = safeRolePath(role);
  if (teamId) await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId);
  revalidatePath(base);
  redirect(`${base}?status=left`);
}

export async function deleteTeamAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const teamId = text(formData, "team_id", 80);
  const base = safeRolePath(role);
  if (teamId) await supabase.from("teams").delete().eq("id", teamId);
  revalidatePath(base);
  redirect(`${base}?status=deleted`);
}
