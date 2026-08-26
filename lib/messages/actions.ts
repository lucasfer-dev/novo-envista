"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { safeInternalPath } from "@/lib/auth/validation";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function root(role: "participant" | "investor") {
  return role === "investor" ? "/investor/messages" : "/app/messages";
}

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function startConversationAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const username = text(formData, "username", 50).replace(/^@/, "");
  if (!username) redirect(`${base}?error=user`);

  const { data: target } = await supabase
    .from("profiles")
    .select("id,username,allow_messages,profile_visibility")
    .eq("username", username)
    .eq("profile_visibility", "platform")
    .eq("allow_messages", true)
    .maybeSingle();

  if (!target || target.id === userId) redirect(`${base}?error=unavailable`);

  const [userA, userB] = canonicalPair(userId, target.id);
  const { data: blocked } = await supabase
    .from("user_blocks")
    .select("blocker_id,blocked_id")
    .or(`and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`)
    .limit(1);
  if (blocked?.length) redirect(`${base}?error=blocked`);

  let { data: conversation } = await supabase
    .from("direct_conversations")
    .select("id")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .maybeSingle();

  if (!conversation) {
    const inserted = await supabase
      .from("direct_conversations")
      .insert({ user_a: userA, user_b: userB, created_by: userId })
      .select("id")
      .single();
    conversation = inserted.data;
    if (!conversation && inserted.error?.code === "23505") {
      const retry = await supabase
        .from("direct_conversations")
        .select("id")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();
      conversation = retry.data;
    }
  }

  if (!conversation) redirect(`${base}?error=create`);
  redirect(`${base}/${conversation.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const conversationId = text(formData, "conversation_id", 80);
  const body = text(formData, "body", 4000);
  const returnTo = safeInternalPath(formData.get("return_to"), conversationId ? `${base}/${conversationId}` : base);
  if (!conversationId || !body) redirect(`${returnTo}?error=message`);

  const { error } = await supabase.from("direct_messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    body,
  });
  if (error) redirect(`${returnTo}?error=send`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function blockUserAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const blockedId = text(formData, "blocked_id", 80);
  if (!blockedId || blockedId === userId) redirect(base);
  await supabase.from("user_blocks").upsert({ blocker_id: userId, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });
  revalidatePath(base);
  redirect(`${base}?status=blocked`);
}

export async function unblockUserAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const blockedId = text(formData, "blocked_id", 80);
  if (blockedId) await supabase.from("user_blocks").delete().eq("blocker_id", userId).eq("blocked_id", blockedId);
  revalidatePath(base);
  redirect(`${base}?status=unblocked`);
}

export async function reportMessageAction(formData: FormData) {
  const { supabase, userId, role } = await requireProductUser();
  const base = root(role);
  const conversationId = text(formData, "conversation_id", 80);
  const messageId = text(formData, "message_id", 80);
  const reason = text(formData, "reason", 80);
  const details = text(formData, "details", 1000);
  const returnTo = conversationId ? `${base}/${conversationId}` : base;
  if (!messageId || !reason) redirect(`${returnTo}?error=report`);
  const { error } = await supabase.from("message_reports").insert({ reporter_id: userId, message_id: messageId, reason, details });
  if (error && error.code !== "23505") redirect(`${returnTo}?error=report`);
  revalidatePath(returnTo);
  redirect(`${returnTo}?status=reported`);
}
