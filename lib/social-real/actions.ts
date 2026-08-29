"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { safeInternalPath } from "@/lib/auth/validation";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function back(formData: FormData, fallback: string) {
  return safeInternalPath(formData.get("return_to"), fallback);
}

function withError(path: string, code: string) {
  return `${path}${path.includes("?") ? "&" : "?"}error=${code}`;
}

export async function createPostAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const fallback = role === "investor" ? "/investor/social" : "/app/social";
  const returnTo = back(formData, fallback);
  const body = text(formData, "body", 5000);
  if (!body) redirect(withError(returnTo, "post"));

  const author = text(formData, "author", 80);
  const personal = !author || author === "personal";
  let authorTeamId: string | null = null;
  if (!personal) {
    const { data: membership } = await supabase.from("team_members").select("team_id").eq("team_id", author).eq("user_id", userId).maybeSingle();
    if (!membership) redirect(withError(returnTo, "author"));
    authorTeamId = author;
  }

  const projectId = text(formData, "project_id", 80) || null;
  if (projectId) {
    const { data: project } = await supabase.from("projects").select("id,owner_user_id,owner_team_id").eq("id", projectId).maybeSingle();
    if (!project) redirect(withError(returnTo, "project"));
    let canAttach = project.owner_user_id === userId;
    if (!canAttach && project.owner_team_id) {
      const { data: projectMembership } = await supabase.from("team_members").select("team_id").eq("team_id", project.owner_team_id).eq("user_id", userId).maybeSingle();
      canAttach = Boolean(projectMembership);
    }
    if (!canAttach) redirect(withError(returnTo, "project"));
  }

  const { data: created, error } = await supabase.from("posts").insert({
    author_user_id: personal ? userId : null,
    author_team_id: authorTeamId,
    project_id: projectId,
    created_by: userId,
    body,
    visibility: formData.get("visibility") === "private" ? "private" : "platform",
  }).select("id").single();
  if (error || !created) redirect(withError(returnTo, "post"));
  revalidatePath(returnTo.split("?")[0]);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}status=posted`);
}

export async function deletePostAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const fallback = role === "investor" ? "/investor/social" : "/app/social";
  const returnTo = back(formData, fallback);
  const postId = text(formData, "post_id", 80);
  if (!postId) redirect(withError(returnTo, "delete-post"));
  const { data: deleted, error } = await supabase.from("posts").delete().eq("id", postId).select("id").maybeSingle();
  if (error || !deleted) redirect(withError(returnTo, "delete-post"));
  revalidatePath(returnTo.split("?")[0]);
  redirect(returnTo);
}

export async function togglePostLikeAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const fallback = role === "investor" ? "/investor/social" : "/app/social";
  const returnTo = back(formData, fallback);
  const postId = text(formData, "post_id", 80);
  if (!postId) redirect(withError(returnTo, "like"));

  const { data: existing, error: lookupError } = await supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  if (lookupError) redirect(withError(returnTo, "like"));

  if (existing) {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) redirect(withError(returnTo, "like"));
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error && error.code !== "23505") redirect(withError(returnTo, "like"));
  }
  revalidatePath(returnTo.split("?")[0]);
  redirect(returnTo);
}

export async function addPostCommentAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const fallback = role === "investor" ? "/investor/social" : "/app/social";
  const returnTo = back(formData, fallback);
  const postId = text(formData, "post_id", 80);
  const body = text(formData, "body", 2000);
  if (!postId || !body) redirect(withError(returnTo, "comment"));
  const { data: created, error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: userId, body }).select("id").single();
  if (error || !created) redirect(withError(returnTo, "comment"));
  revalidatePath(returnTo.split("?")[0]);
  redirect(returnTo);
}

export async function deletePostCommentAction(formData: FormData) {
  const { supabase, role } = await requireProductUser();
  const fallback = role === "investor" ? "/investor/social" : "/app/social";
  const returnTo = back(formData, fallback);
  const id = text(formData, "comment_id", 80);
  if (!id) redirect(withError(returnTo, "delete-comment"));
  const { data: deleted, error } = await supabase.from("post_comments").delete().eq("id", id).select("id").maybeSingle();
  if (error || !deleted) redirect(withError(returnTo, "delete-comment"));
  revalidatePath(returnTo.split("?")[0]);
  redirect(returnTo);
}

export async function toggleFollowAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const fallback = role === "investor" ? "/investor" : "/app";
  const returnTo = back(formData, fallback);
  const type = text(formData, "target_type", 20);
  const id = text(formData, "target_id", 80);
  if (!id || !["profile", "team", "project"].includes(type)) redirect(withError(returnTo, "follow"));

  const column = type === "profile" ? "target_profile_id" : type === "team" ? "target_team_id" : "target_project_id";
  const { data: existing, error: lookupError } = await supabase.from("follows").select("follower_id").eq("follower_id", userId).eq(column, id).maybeSingle();
  if (lookupError) redirect(withError(returnTo, "follow"));

  if (existing) {
    const { error } = await supabase.from("follows").delete().eq("follower_id", userId).eq(column, id);
    if (error) redirect(withError(returnTo, "follow"));
  } else {
    const { error } = await supabase.from("follows").insert({ follower_id: userId, [column]: id });
    if (error && error.code !== "23505") redirect(withError(returnTo, "follow"));
  }
  revalidatePath(returnTo.split("?")[0]);
  redirect(returnTo);
}
