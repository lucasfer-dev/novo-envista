"use server";

import { redirect } from "next/navigation";
import { resolveSiteUrl } from "@/lib/auth/site-url";
import { isPublicSignupReady } from "@/lib/auth/signup-readiness";
import { createClient } from "@/lib/supabase/server";
import {
  INTERNAL_PRIVACY_VERSION,
  INTERNAL_TERMS_VERSION,
  isValidEmail,
  normalizePrivateDocument,
  parseBirthDate,
  parseProductRole,
  privateDocumentKind,
  validatePassword,
} from "@/lib/auth/validation";

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
function isRetryableAuthFailure(error: { status?: number } | null) {
  return error?.status === 502 || error?.status === 503 || error?.status === 504;
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
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
  if (!isPublicSignupReady()) redirect("/register?status=closed");

  const displayName = value(formData, "display_name").slice(0, 100);
  const email = value(formData, "email").toLowerCase();
  const documentValue = value(formData, "document");
  const normalizedDocument = normalizePrivateDocument(documentValue);
  const documentKind = privateDocumentKind(documentValue);
  const birthDate = parseBirthDate(value(formData, "birth_date"));
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmation = typeof formData.get("password_confirmation") === "string" ? String(formData.get("password_confirmation")) : "";
  const role = parseProductRole(formData.get("role"));
  const acceptedTerms = formData.get("terms") === "on";
  const acknowledgedPrivacy = formData.get("privacy") === "on";

  if (!displayName || !isValidEmail(email)) redirect(errorPath("invalid"));
  if (!documentValue || !documentKind) redirect(errorPath("document"));
  if (!birthDate) redirect(errorPath("birth-date"));
  if (!acceptedTerms || !acknowledgedPrivacy) redirect(errorPath("legal"));
  if (validatePassword(password) || password !== confirmation) redirect(errorPath("password"));

  const captchaToken = value(formData, TURNSTILE_FIELD).slice(0, 4096);
  if (captchaConfigured() && !captchaToken) redirect(errorPath("captcha"));

  const privateIdentifier = { [documentKind]: normalizedDocument };
  const supabase = await createClient();
  const signupPayload = {
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
        birth_date: birthDate,
        signup_terms_accepted: true,
        signup_terms_version: INTERNAL_TERMS_VERSION,
        signup_privacy_acknowledged: true,
        signup_privacy_version: INTERNAL_PRIVACY_VERSION,
        ...privateIdentifier,
      },
      emailRedirectTo: `${resolveSiteUrl()}/confirm-email`,
      ...(captchaToken ? { captchaToken } : {}),
    },
  };

  let { data, error } = await supabase.auth.signUp(signupPayload);

  // A short retry absorbs transient gateway/Auth outages without retrying
  // validation failures, rate limits, or database-trigger errors.
  if (isRetryableAuthFailure(error)) {
    await wait(650);
    ({ data, error } = await supabase.auth.signUp(signupPayload));
  }

  if (error) {
    const code = authFailureCode(error);
    if (code === "captcha" || code === "rate" || code === "temporary") redirect(errorPath(code));
    if (error.code === "weak_password") redirect(errorPath("password"));
    if (error.code === "user_already_exists") redirect(errorPath("exists"));
    redirect(errorPath("invalid"));
  }

  if (data.session) redirect("/onboarding");
  redirect("/register?status=check-email");
}
