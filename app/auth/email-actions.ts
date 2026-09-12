"use server";

import { redirect } from "next/navigation";
import {
  clearRecoveryIntent,
  hasValidRecoveryIntent,
  issueRecoveryIntent,
} from "@/lib/auth/recovery-intent";
import { validatePassword } from "@/lib/auth/validation";
import { logServerEvent } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";

type EmailFlow = "confirmation" | "recovery";
type ExpectedOtpType = "email" | "recovery";

function value(formData: FormData, name: string) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, 2048) : "";
}

function credentialFrom(formData: FormData) {
  return {
    tokenHash: value(formData, "token_hash"),
    code: value(formData, "code"),
    type: value(formData, "type").toLowerCase(),
  };
}

function authError(flow: EmailFlow, reason: string) {
  return `/auth/error?reason=${encodeURIComponent(reason)}&flow=${flow}`;
}

function expectedType(flow: EmailFlow): ExpectedOtpType {
  return flow === "recovery" ? "recovery" : "email";
}

function validateCredential(flow: EmailFlow, tokenHash: string, code: string, type: string) {
  if (!tokenHash && !code) return "missing-credentials";
  if (tokenHash && code) return "ambiguous-credentials";
  const expected = expectedType(flow);
  if (tokenHash && type !== expected) return "invalid-type";
  if (code && type && type !== expected) return "invalid-type";
  return null;
}

function logExchangeFailure(
  flow: EmailFlow,
  transport: "token_hash" | "pkce",
  stage: string,
  error?: { code?: string; status?: number } | null,
) {
  logServerEvent("warn", "auth.email.exchange_failed", {
    flow,
    transport,
    stage,
    error_code: error?.code ?? null,
    status: error?.status ?? null,
  });
}

async function establishSession(flow: EmailFlow, tokenHash: string, code: string, type: string) {
  const validationError = validateCredential(flow, tokenHash, code, type);
  if (validationError) {
    logExchangeFailure(flow, tokenHash ? "token_hash" : "pkce", validationError);
    redirect(authError(flow, validationError));
  }

  const supabase = await createClient({ requireCookieWrites: true });
  const transport = tokenHash ? "token_hash" : "pkce";

  let result;
  try {
    result = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: expectedType(flow) })
      : await supabase.auth.exchangeCodeForSession(code);
  } catch (error) {
    logServerEvent("error", "auth.email.exchange_exception", {
      flow,
      transport,
      error_name: error instanceof Error ? error.name : "UnknownError",
    });
    redirect(authError(flow, "cookie-persistence"));
  }

  if (result.error) {
    logExchangeFailure(flow, transport, transport === "pkce" ? "exchange" : "verify-otp", result.error);
    redirect(authError(flow, transport === "pkce" ? "exchange" : "invalid-or-expired-token"));
  }

  const userId = result.data.session?.user?.id;
  if (!userId) {
    logExchangeFailure(flow, transport, "session-not-returned");
    redirect(authError(flow, "session-not-returned"));
  }

  if (flow === "recovery") {
    try {
      await issueRecoveryIntent(userId);
    } catch (error) {
      logServerEvent("error", "auth.recovery_intent.issue_failed", {
        error_name: error instanceof Error ? error.name : "UnknownError",
      });
      await supabase.auth.signOut({ scope: "local" });
      redirect(authError(flow, "recovery-intent"));
    }
  }
}

export async function confirmEmailAction(formData: FormData) {
  const { tokenHash, code, type } = credentialFrom(formData);
  await establishSession("confirmation", tokenHash, code, type);
  redirect("/confirm-email?status=confirmed");
}

export async function establishRecoverySession(tokenHash: string, code: string, type = "") {
  await establishSession(
    "recovery",
    tokenHash.trim().slice(0, 2048),
    code.trim().slice(0, 2048),
    type.trim().toLowerCase().slice(0, 64),
  );
}

export async function beginRecoveryAction(formData: FormData) {
  const { tokenHash, code, type } = credentialFrom(formData);
  await establishSession("recovery", tokenHash, code, type);
  redirect("/update-password");
}

export async function updateRecoveryPasswordAction(formData: FormData) {
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmation =
    typeof formData.get("password_confirmation") === "string"
      ? String(formData.get("password_confirmation"))
      : "";

  if (validatePassword(password) || password !== confirmation) {
    redirect("/update-password?error=password");
  }

  const supabase = await createClient({ requireCookieWrites: true });
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    logServerEvent("warn", "auth.password_update.denied", { reason: "missing-session" });
    redirect(authError("recovery", "recovery-session"));
  }

  if (!(await hasValidRecoveryIntent(userId))) {
    logServerEvent("warn", "auth.password_update.denied", { reason: "missing-recovery-intent" });
    redirect(authError("recovery", "recovery-intent"));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logServerEvent("warn", "auth.password_update.failed", {
      error_code: error.code ?? null,
      status: error.status ?? null,
    });
    redirect("/update-password?error=save");
  }

  await clearRecoveryIntent();
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    logServerEvent("warn", "auth.password_update.global_signout_failed", {
      error_code: signOutError.code ?? null,
      status: signOutError.status ?? null,
    });
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect("/login?status=password-updated");
}
