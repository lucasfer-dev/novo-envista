"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/auth/validation";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

const TYPES = new Set(["access","correction","deletion","portability","sharing","minor","other"]);

export async function submitPrivacyContactAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase().slice(0, 254);
  const requestType = value(formData, "request_type");
  const message = value(formData, "message").slice(0, 2000);
  const website = value(formData, "website");

  if (website) redirect("/privacy/contact?status=sent");
  if (!isValidEmail(email) || !TYPES.has(requestType)) {
    redirect("/privacy/contact?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("privacy_contact_requests").insert({
    email,
    request_type: requestType,
    message,
    status: "open",
    admin_note: "",
    resolved_at: null,
  });

  if (error) redirect("/privacy/contact?error=temporary");
  redirect("/privacy/contact?status=sent");
}
