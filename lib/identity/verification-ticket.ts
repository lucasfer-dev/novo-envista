import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { AgeBand } from "@/lib/identity/birth-date";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function createIdentityVerificationTicket(
  cpf: string,
  email: string,
  ageBand: AgeBand,
) {
  const supabase = adminClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("create_pending_identity_verification", {
    cpf_value: cpf,
    email_value: email,
    age_band_value: ageBand,
  });

  if (error || typeof data !== "string") return null;
  return data;
}
