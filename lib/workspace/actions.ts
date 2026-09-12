"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function returnPath(formData: FormData) {
  const raw = value(formData, "return_to");
  return raw.startsWith("/app/workspace") ? raw : "/app/workspace";
}

async function userId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (error || !id) redirect("/login?error=session");
  return { supabase, id };
}

export async function createTeamTaskAction(formData: FormData) {
  const { supabase, id } = await userId();
  const teamId = value(formData, "team_id");
  const title = value(formData, "title").slice(0, 140);
  const description = value(formData, "description").slice(0, 700);
  const dueDate = value(formData, "due_date");
  const back = returnPath(formData);
  if (!teamId || title.length < 2) redirect(`${back}${back.includes("?") ? "&" : "?"}error=task`);

  const { error } = await supabase.from("team_tasks").insert({
    team_id: teamId,
    created_by: id,
    title,
    description,
    due_date: dueDate || null,
    status: "todo",
  });
  if (error) redirect(`${back}${back.includes("?") ? "&" : "?"}error=task`);
  revalidatePath(back.split("?")[0]);
  redirect(back);
}

export async function moveTeamTaskAction(formData: FormData) {
  const { supabase } = await userId();
  const taskId = value(formData, "task_id");
  const status = value(formData, "status");
  const back = returnPath(formData);
  if (!taskId || !["todo", "doing", "done"].includes(status)) redirect(back);
  await supabase.from("team_tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", taskId);
  revalidatePath(back.split("?")[0]);
  redirect(back);
}

export async function deleteTeamTaskAction(formData: FormData) {
  const { supabase } = await userId();
  const taskId = value(formData, "task_id");
  const back = returnPath(formData);
  if (taskId) await supabase.from("team_tasks").delete().eq("id", taskId);
  revalidatePath(back.split("?")[0]);
  redirect(back);
}
