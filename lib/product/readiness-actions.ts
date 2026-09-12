"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { requireAdminUser } from "@/lib/admin/require-admin";

const PIPELINE_STATUSES = new Set(["new", "viewed", "contacted", "meeting", "closed"]);
const VERIFICATION_STATUSES = new Set(["verified", "rejected"]);

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitInvestorVerificationAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("investor");
  const organizationName = text(formData, "organization_name", 160);
  const organizationType = text(formData, "organization_type", 100);
  const websiteUrl = text(formData, "website_url", 500);

  if (organizationName.length < 2) redirect("/investor/verification?error=organization");
  if (websiteUrl && !/^https:\/\//i.test(websiteUrl)) redirect("/investor/verification?error=url");

  const { data: existing } = await supabase
    .from("investor_verifications")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.status === "verified") redirect("/investor/verification?status=verified");
  if (existing?.status === "pending") redirect("/investor/verification?status=pending");

  const { error } = await supabase.from("investor_verifications").upsert({
    user_id: userId,
    status: "pending",
    organization_name: organizationName,
    organization_type: organizationType,
    website_url: websiteUrl,
    review_note: "",
    requested_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) redirect("/investor/verification?error=save");
  revalidatePath("/investor/verification");
  redirect("/investor/verification?status=pending");
}

export async function updateProjectInterestPipelineAction(formData: FormData) {
  const { supabase } = await requireProductUser("participant");
  const interestId = text(formData, "interest_id", 80);
  const nextStatus = text(formData, "owner_status", 20);
  if (!interestId || !PIPELINE_STATUSES.has(nextStatus)) redirect("/app/interests?error=invalid");

  const { data, error } = await supabase
    .from("project_interests")
    .update({ owner_status: nextStatus })
    .eq("id", interestId)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/app/interests?error=update");
  revalidatePath("/app/interests");
  revalidatePath("/investor/interests");
  redirect("/app/interests?status=updated");
}

export async function reviewInvestorVerificationAction(formData: FormData) {
  const { supabase, userId } = await requireAdminUser();
  const targetUserId = text(formData, "user_id", 80);
  const status = text(formData, "status", 20);
  const note = text(formData, "review_note", 1000);
  if (!targetUserId || !VERIFICATION_STATUSES.has(status)) redirect("/admin/investors?error=invalid");

  const { data, error } = await supabase
    .from("investor_verifications")
    .update({
      status,
      review_note: note,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", targetUserId)
    .eq("status", "pending")
    .select("user_id")
    .maybeSingle();

  if (error || !data) redirect("/admin/investors?error=review");
  await supabase.from("notifications").insert({
    user_id: targetUserId,
    kind: "investor_verification",
    actor_user_id: userId,
    title: status === "verified" ? "Perfil de investidor verificado" : "Verificação precisa de ajustes",
    body: status === "verified" ? "Sua conta agora pode demonstrar interesse em projetos." : (note || "Revise seus dados e envie a solicitação novamente."),
    href: "/investor/verification",
  });

  revalidatePath("/admin/investors");
  revalidatePath("/investor/verification");
  redirect("/admin/investors?status=reviewed");
}
