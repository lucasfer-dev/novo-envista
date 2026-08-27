"use server";

import { redirect } from "next/navigation";
import { resolveSiteUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";
import {
  homeForRole,
  INTERNAL_PRIVACY_VERSION,
  INTERNAL_TERMS_VERSION,
  isValidEmail,
  isValidUsername,
  normalizeUsername,
  parseAgeBand,
  parseProductRole,
  pathAllowedForRole,
  safeInternalPath,
  validatePassword,
} from "@/lib/auth/validation";

const TURNSTILE_FIELD = "cf-turnstile-response";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function authErrorPath(base: string, code: string) {
  return `${base}?error=${encodeURIComponent(code)}`;
}

function captchaConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

function getCaptchaToken(formData: FormData, base: string) {
  const token = value(formData, TURNSTILE_FIELD).slice(0, 4096);
  if (captchaConfigured() && !token) redirect(authErrorPath(base, "captcha"));
  return token || undefined;
}

function authFailureCode(error: { code?: string; status?: number } | null) {
  if (!error) return "invalid";
  const code = error.code?.toLowerCase() ?? "";
  if (code.includes("captcha")) return "captcha";
  if (error.status === 429 || code.includes("rate_limit") || code.includes("rate-limit")) return "rate";
  if (error.status && error.status >= 500) return "temporary";
  return "invalid";
}

async function getVerifiedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");
  return { supabase, userId };
}

async function destinationForSignedInUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requestedNext?: string,
) {
  const [{ data: profile }, { data: compliance }, { data: completion }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase
      .from("account_compliance")
      .select("age_band,guardian_consent_verified_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_completions")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const role = parseProductRole(profile?.role);
  if (!completion) return "/onboarding";
  if (compliance?.age_band === "child" && !compliance.guardian_consent_verified_at) {
    return "/guardian-required";
  }

  const fallback = homeForRole(role);
  const next = safeInternalPath(requestedNext, fallback);
  return pathAllowedForRole(next, role) ? next : fallback;
}

export async function loginAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const requestedNext = safeInternalPath(formData.get("next"), "");

  if (!isValidEmail(email) || !password) redirect(authErrorPath("/login", "invalid"));
  const captchaToken = getCaptchaToken(formData, "/login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });
  if (error) redirect(authErrorPath("/login", authFailureCode(error)));

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect(authErrorPath("/login", "session"));

  redirect(await destinationForSignedInUser(supabase, userId, requestedNext));
}

export async function registerAction(formData: FormData) {
  if (process.env.AUTH_SIGNUP_ENABLED !== "true") redirect("/register?status=closed");

  const displayName = value(formData, "display_name").slice(0, 100);
  const email = value(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmation =
    typeof formData.get("password_confirmation") === "string"
      ? String(formData.get("password_confirmation"))
      : "";
  const role = parseProductRole(formData.get("role"));

  if (!displayName || !isValidEmail(email)) redirect(authErrorPath("/register", "invalid"));
  if (validatePassword(password) || password !== confirmation) {
    redirect(authErrorPath("/register", "password"));
  }
  const captchaToken = getCaptchaToken(formData, "/register");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role },
      emailRedirectTo: `${resolveSiteUrl()}/auth/callback?next=/onboarding`,
      ...(captchaToken ? { captchaToken } : {}),
    },
  });

  if (error) {
    const code = authFailureCode(error);
    if (code === "captcha" || code === "rate" || code === "temporary") {
      redirect(authErrorPath("/register", code));
    }
    if (error.code === "weak_password") redirect(authErrorPath("/register", "password"));
    // Mantém resposta genérica para não transformar cadastro em consulta de existência de conta.
    redirect("/register?status=check-email");
  }
  if (data.session) redirect("/onboarding");
  redirect("/register?status=check-email");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!isValidEmail(email)) redirect("/forgot-password?status=sent");
  const captchaToken = getCaptchaToken(formData, "/forgot-password");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${resolveSiteUrl()}/auth/callback?next=/update-password`,
    ...(captchaToken ? { captchaToken } : {}),
  });
  if (error) {
    const code = authFailureCode(error);
    if (code === "captcha" || code === "rate" || code === "temporary") {
      redirect(authErrorPath("/forgot-password", code));
    }
  }
  // Resposta intencionalmente genérica para evitar enumeração de contas.
  redirect("/forgot-password?status=sent");
}

export async function updatePasswordAction(formData: FormData) {
  const { supabase } = await getVerifiedUser();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmation =
    typeof formData.get("password_confirmation") === "string"
      ? String(formData.get("password_confirmation"))
      : "";

  if (validatePassword(password) || password !== confirmation) {
    redirect("/update-password?error=password");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/update-password?error=save");

  // Revoga refresh tokens existentes e encerra a sessão usada na recuperação.
  // Se a revogação global falhar por indisponibilidade temporária, pelo menos
  // removemos a sessão atual do navegador antes de voltar ao login.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) await supabase.auth.signOut({ scope: "local" });
  redirect("/login?status=password-updated");
}

async function ensureLegalEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  documentType: "terms" | "privacy",
  documentVersion: string,
) {
  const { data: existing } = await supabase
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("document_type", documentType)
    .eq("document_version", documentVersion)
    .maybeSingle();

  if (existing) return null;
  const { error } = await supabase.from("legal_acceptances").insert({
    user_id: userId,
    document_type: documentType,
    document_version: documentVersion,
    context: "internal_test",
  });
  return error;
}

export async function onboardingAction(formData: FormData) {
  const { supabase, userId } = await getVerifiedUser();
  const username = normalizeUsername(formData.get("username"));
  const displayName = value(formData, "display_name").slice(0, 100);
  const ageBand = parseAgeBand(formData.get("age_band"));
  const acceptedTerms = formData.get("terms") === "on";
  const acknowledgedPrivacy = formData.get("privacy") === "on";

  if (!displayName || !isValidUsername(username) || !ageBand || !acceptedTerms || !acknowledgedPrivacy) {
    redirect("/onboarding?error=invalid");
  }

  const profilePatch = {
    username,
    display_name: displayName,
    bio: value(formData, "bio").slice(0, 500) || null,
    public_city: value(formData, "public_city").slice(0, 100) || null,
    public_state: value(formData, "public_state").slice(0, 100) || null,
    public_school: value(formData, "public_school").slice(0, 160) || null,
    organization: value(formData, "organization").slice(0, 160) || null,
    organization_type: value(formData, "organization_type").slice(0, 100) || null,
    profile_visibility: "private" as const,
    allow_messages: false,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", userId);
  if (profileError) {
    redirect(`/onboarding?error=${profileError.code === "23505" ? "username" : "profile"}`);
  }

  const { data: compliance } = await supabase
    .from("account_compliance")
    .select("age_band")
    .eq("user_id", userId)
    .single();

  if (compliance?.age_band === "unknown") {
    const { error: ageError } = await supabase
      .from("account_compliance")
      .update({ age_band: ageBand })
      .eq("user_id", userId);
    if (ageError) redirect("/onboarding?error=age");
  } else if (compliance?.age_band !== ageBand) {
    redirect("/onboarding?error=age-locked");
  }

  const termsError = await ensureLegalEvent(supabase, userId, "terms", INTERNAL_TERMS_VERSION);
  const privacyError = await ensureLegalEvent(
    supabase,
    userId,
    "privacy",
    INTERNAL_PRIVACY_VERSION,
  );
  if (termsError || privacyError) redirect("/onboarding?error=legal");

  const { data: completion } = await supabase
    .from("onboarding_completions")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!completion) {
    const { error: completionError } = await supabase
      .from("onboarding_completions")
      .insert({ user_id: userId });
    if (completionError) redirect("/onboarding?error=completion");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (ageBand === "child") redirect("/guardian-required");
  redirect(homeForRole(parseProductRole(profile?.role)));
}

export async function profileUpdateAction(formData: FormData) {
  const { supabase, userId } = await getVerifiedUser();
  const username = normalizeUsername(formData.get("username"));
  const displayName = value(formData, "display_name").slice(0, 100);
  if (!displayName || !isValidUsername(username)) redirect("/account/profile?error=invalid");

  const { data: compliance } = await supabase
    .from("account_compliance")
    .select("age_band,guardian_consent_verified_at")
    .eq("user_id", userId)
    .single();
  if (!compliance || compliance.age_band === "unknown") redirect("/onboarding");

  let profileVisibility = formData.get("profile_visibility") === "platform" ? "platform" : "private";
  let allowMessages = formData.get("allow_messages") === "on";
  if (compliance.age_band === "child") {
    allowMessages = false;
    if (!compliance.guardian_consent_verified_at) profileVisibility = "private";
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      bio: value(formData, "bio").slice(0, 500) || null,
      public_city: value(formData, "public_city").slice(0, 100) || null,
      public_state: value(formData, "public_state").slice(0, 100) || null,
      public_school: value(formData, "public_school").slice(0, 160) || null,
      organization: value(formData, "organization").slice(0, 160) || null,
      organization_type: value(formData, "organization_type").slice(0, 100) || null,
      profile_visibility: profileVisibility,
      allow_messages: allowMessages,
    })
    .eq("id", userId);

  if (error) redirect(`/account/profile?error=${error.code === "23505" ? "username" : "save"}`);
  redirect("/account/profile?status=saved");
}
