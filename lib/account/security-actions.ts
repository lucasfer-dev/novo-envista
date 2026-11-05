"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { privateDocumentKind, normalizePrivateDocument, validatePassword } from "@/lib/auth/validation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

function text(formData: FormData, name: string, max = 500) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

async function currentUser() {
  const supabase = await createClient({ requireCookieWrites: true });
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login?error=session");

  return { supabase, user: userData.user };
}

export async function updateAccountEmailAction(formData: FormData) {
  const { supabase, user } = await currentUser();
  const email = text(formData, "email", 254).toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    redirect("/account/security?error=invalid-email");
  }

  if (email === user.email?.toLowerCase()) {
    redirect("/account/security?error=same-email");
  }

  const { error } = await supabase.auth.updateUser({ email });
  if (error) redirect("/account/security?error=email-update");

  redirect("/account/security?status=email-pending");
}

export async function updateAccountPasswordAction(formData: FormData) {
  const { supabase } = await currentUser();
  const currentPassword = text(formData, "current_password", 200);
  const password = text(formData, "password", 200);
  const confirmPassword = text(formData, "confirm_password", 200);

  if (validatePassword(password)) redirect("/account/security?error=weak-password");
  if (password !== confirmPassword) redirect("/account/security?error=password-mismatch");
  if (!currentPassword) redirect("/account/security?error=current-password");

  const { error } = await supabase.auth.updateUser({
    password,
    current_password: currentPassword,
  });
  if (error) redirect("/account/security?error=password-update");

  redirect("/account/security?status=password-updated");
}

export async function signOutOtherDevicesAction() {
  const { supabase } = await currentUser();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) redirect("/account/security?error=signout-others");
  redirect("/account/security?status=other-sessions-ended");
}


/**
 * Legacy accounts created before CPF/CNPJ collection can opt in to document
 * login after proving control of their verified email and current password.
 * Only this server action uses the service-role credential; browser/RPC users
 * have no EXECUTE permission for the privileged attachment function.
 */
export async function linkLoginDocumentAction(formData: FormData) {
  const { user } = await currentUser();

  const rawDocument = text(formData, "document", 18);
  const kind = privateDocumentKind(rawDocument);
  const document = normalizePrivateDocument(rawDocument);
  const passwordField = formData.get("current_password");
  const currentPassword = typeof passwordField === "string" ? passwordField : "";
  const isOwner = formData.get("document_declaration") === "on";

  if (!kind) redirect("/account/security?error=document-invalid");
  if (!isOwner) redirect("/account/security?error=document-declaration");
  if (!currentPassword || currentPassword.length > 128) {
    redirect("/account/security?error=document-password");
  }
  if (!user.email || !user.email_confirmed_at) {
    redirect("/account/security?error=document-unverified");
  }

  const { url, publishableKey } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) redirect("/account/security?error=document-temporary");

  // Reauthentication happens in an isolated client so the current session's
  // cookies are never replaced by the temporary password-verification session.
  const verifier = createSupabaseAdminClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: passwordCheck, error: passwordError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (passwordError || passwordCheck.user?.id !== user.id) {
    if (passwordCheck.session) await verifier.auth.signOut({ scope: "local" });
    redirect("/account/security?error=document-password");
  }

  // Do not keep the temporary login session alive after verification.
  await verifier.auth.signOut({ scope: "local" });

  const admin = createSupabaseAdminClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: outcome, error: linkError } = await admin.rpc("link_legacy_login_document", {
    target_user_id: user.id,
    document_kind: kind,
    document_value: document,
  });
  if (linkError) redirect("/account/security?error=document-temporary");
  if (outcome === "rate") redirect("/account/security?error=document-rate");
  if (outcome === "already-linked") redirect("/account/security?status=document-linked");
  if (outcome !== "linked") redirect("/account/security?error=document-unavailable");
  redirect("/account/security?status=document-linked");
}
