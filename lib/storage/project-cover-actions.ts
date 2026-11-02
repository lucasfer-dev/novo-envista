"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductUser } from "@/lib/auth/require-product-user";

function field(formData: FormData, name: string, maxLength: number) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

export async function setProjectCoverAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const projectId = field(formData, "project_id", 80);
  const attachmentId = field(formData, "attachment_id", 80);
  const slug = field(formData, "slug", 90);
  const destination = "/app/projects/" + encodeURIComponent(slug);
  if (!projectId || !attachmentId || !slug) redirect("/app/projects");

  const { data: attachment } = await supabase
    .from("project_attachments")
    .select("id,path,mime_type,project_id")
    .eq("id", attachmentId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!attachment || !["image/jpeg", "image/png", "image/webp"].includes(attachment.mime_type)) {
    redirect(destination + "?error=cover");
  }
  // A política RLS de projects restringe a atualização ao proprietário/equipe autorizada.
  const { data, error } = await supabase.from("projects")
    .update({ cover_path: attachment.path })
    .eq("id", projectId)
    .eq("slug", slug)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect(destination + "?error=cover");
  revalidatePath(destination);
  revalidatePath("/app/projects");
  redirect(destination + "?status=saved");
}
