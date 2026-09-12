"use server";

import { redirect } from "next/navigation";
import { resolveSiteUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";
import { isValidCpf, isValidEmail, normalizeCpf, parseProductRole, validatePassword } from "@/lib/auth/validation";
import { parseBirthDate } from "@/lib/identity/birth-date";
import { verifyCpfWithSerpro } from "@/lib/identity/serpro-cpf";
import { createIdentityVerificationTicket } from "@/lib/identity/verification-ticket";

const TURNSTILE_FIELD = "cf-turnstile-response";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}
function errorPath(code: string) {
  return `/register?error=${encodeURIComponent(code)}`;
}
function captchaConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}
function authFailureCode(error: { code?: string; status?: number } | null) {
  if (!error) return "invalid";
  const code = error.code?.toLowerCase() ?? "";
  if (code.includes("captcha")) return "captcha";
  if (error.status === 429 || code.includes("rate_limit") || code.includes("rate-limit")) return "rate";
  if (error.status && error.status >= 500) return "temporary";
  return "invalid";
}

export async function registerProductAction(formData: FormData) {
  if (process.env.AUTH_SIGNUP_ENABLED !== "true") redirect("/register?status=closed");

  const displayName = value(formData, "display_name").slice(0, 100);
  const email = value(formData, "email").toLowerCase();
  const cpf = normalizeCpf(value(formData, "cpf"));
  const birthDate = value(formData, "birth_date");
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmation = typeof formData.get("password_confirmation") === "string" ? String(formData.get("password_confirmation")) : "";
  const role = parseProductRole(formData.get("role"));

  if (!displayName || !isValidEmail(email)) redirect(errorPath("invalid"));
  if (!cpf || !isValidCpf(cpf)) redirect(errorPath("cpf"));
  if (!parseBirthDate(birthDate)) redirect(errorPath("birthdate"));
  if (validatePassword(password) || password !== confirmation) redirect(errorPath("password"));

  const captchaToken = value(formData, TURNSTILE_FIELD).slice(0, 4096);
  if (captchaConfigured() && !captchaToken) redirect(errorPath("captcha"));

  const identity = await verifyCpfWithSerpro(cpf, birthDate);
  if (!identity.ok) {
    if (identity.reason === "invalid_birth_date") redirect(errorPath("birthdate"));
    if (identity.reason === "mismatch") redirect(errorPath("identity"));
    if (identity.reason === "non_regular") redirect(errorPath("cpf-status"));
    redirect(errorPath("verification-unavailable"));
  }

  const verificationId = await createIdentityVerificationTicket(cpf, email, identity.ageBand);
  if (!verificationId) redirect(errorPath("verification-unavailable"));

  const supabase = await createClient();
  const metadata: Record<string, string> = {
    display_name: displayName,
    role,
    cpf,
    verification_id: verificationId,
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${resolveSiteUrl()}/confirm-email`,
      ...(captchaToken ? { captchaToken } : {}),
    },
  });

  if (error) {
    const code = authFailureCode(error);
    if (code === "captcha" || code === "rate" || code === "temporary") redirect(errorPath(code));
    if (error.code === "weak_password") redirect(errorPath("password"));
    redirect("/register?status=check-email");
  }

  if (data.session) redirect("/onboarding");
  redirect("/register?status=check-email");
}
