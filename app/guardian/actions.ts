"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidCpf, safeInternalPath } from "@/lib/auth/validation";

const GUARDIAN_DECLARATION_VERSION = "2026-09-25-v1";

function value(formData: FormData, name: string, max = 256) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

async function authenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");
  return { supabase, userId };
}

export async function continueProtectedModeAction() {
  const { supabase } = await authenticatedUser();
  const { error } = await supabase.rpc("start_protected_minor_mode");
  if (error) redirect("/guardian-choice?error=protected-mode");
  redirect("/onboarding");
}

export async function startGuardianVerificationAction(formData: FormData) {
  const { supabase } = await authenticatedUser();
  const guardianName = value(formData, "guardian_name", 120);
  const relationship = value(formData, "guardian_relationship", 40);
  const cpf = value(formData, "guardian_cpf", 32);
  const next = safeInternalPath(formData.get("next"), "/onboarding");

  if (guardianName.length < 2) redirect(`/guardian?error=name&next=${encodeURIComponent(next)}`);
  if (!["mother", "father", "legal_guardian", "other"].includes(relationship)) {
    redirect(`/guardian?error=relationship&next=${encodeURIComponent(next)}`);
  }
  if (!isValidCpf(cpf)) redirect(`/guardian?error=cpf&next=${encodeURIComponent(next)}`);

  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.rpc("create_guardian_verification_request", {
    guardian_name_input: guardianName,
    relationship_input: relationship,
    guardian_cpf_input: cpf,
    confirmation_token: token,
  });

  if (error) redirect(`/guardian?error=request&next=${encodeURIComponent(next)}`);
  redirect(`/guardian/pending?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`);
}

export async function confirmGuardianVerificationAction(formData: FormData) {
  const token = value(formData, "token", 256);
  const cpf = value(formData, "guardian_cpf", 32);
  const accepted = formData.get("guardian_declaration") === "on";

  if (!token || !isValidCpf(cpf) || !accepted) {
    redirect(`/guardian/confirm?token=${encodeURIComponent(token)}&error=invalid`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_guardian_verification", {
    confirmation_token: token,
    guardian_cpf_input: cpf,
    declaration_version_input: GUARDIAN_DECLARATION_VERSION,
  });

  if (error || !data) {
    redirect(`/guardian/confirm?token=${encodeURIComponent(token)}&error=invalid`);
  }

  redirect("/guardian/confirm?status=success");
}
