"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  if (password.length < 8) redirect("/account/security?error=weak-password");
  if (password !== confirmPassword) redirect("/account/security?error=password-mismatch");
  if (!currentPassword) redirect("/account/security?error=current-password");

  // Supabase supports validating the current password when Secure password change
  // is enabled. Keeping the value in a variable avoids coupling this file to a
  // specific generated Auth type version while still sending the supported field.
  const attributes = {
    password,
    current_password: currentPassword,
  };

  const { error } = await supabase.auth.updateUser(attributes);
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("current") || message.includes("invalid") || message.includes("password")) {
      redirect("/account/security?error=password-update");
    }
    redirect("/account/security?error=password-update");
  }

  redirect("/account/security?status=password-updated");
}

export async function signOutOtherDevicesAction() {
  const { supabase } = await currentUser();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) redirect("/account/security?error=signout-others");
  redirect("/account/security?status=other-sessions-ended");
}
