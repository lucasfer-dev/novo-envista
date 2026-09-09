import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createSupabaseContext } from "npm:@supabase/server@1.5.3";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
};

const CPF_LOGIN_SINK_EMAIL = "cpf-login-sink@invalid.envista.local";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function normalizeCpf(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function isValidCpf(value: unknown) {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const checkDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const digit = 11 - (sum % 11);
    return digit >= 10 ? 0 : digit;
  };

  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

function authError(error: { code?: string; status?: number } | null) {
  const code = error?.code?.toLowerCase() ?? "";
  if (code.includes("captcha")) return json({ error: "captcha" }, 400);
  if (error?.status === 429 || code.includes("rate_limit") || code.includes("rate-limit")) {
    return json({ error: "rate" }, 429);
  }
  if (error?.status && error.status >= 500) return json({ error: "temporary" }, 503);
  return json({ error: "invalid_credentials" }, 401);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const { data: ctx, error: contextError } = await createSupabaseContext(req, { auth: "publishable" });
  if (contextError || !ctx) return json({ error: "invalid_credentials" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_credentials" }, 401);
  }

  const cpf = normalizeCpf(payload.cpf);
  const password = typeof payload.password === "string" ? payload.password : "";
  const captchaToken =
    typeof payload.captchaToken === "string" ? payload.captchaToken.slice(0, 4096) : undefined;

  if (!isValidCpf(cpf) || !password || password.length > 128) {
    return json({ error: "invalid_credentials" }, 401);
  }

  try {
    const { data: userId, error: mappingError } = await ctx.supabaseAdmin.rpc("resolve_cpf_login", {
      cpf_value: cpf,
    });

    if (mappingError) return json({ error: "temporary" }, 503);

    // Always execute a real password-auth request for valid CPF shapes. When the
    // mapping does not exist we use a fixed sink address so CAPTCHA/rate-limit
    // behavior stays in the authentication layer and account existence is not
    // exposed by a short-circuit response.
    let email = CPF_LOGIN_SINK_EMAIL;
    if (typeof userId === "string" && userId) {
      const { data: userData } = await ctx.supabaseAdmin.auth.admin.getUserById(userId);
      if (userData.user?.email) email = userData.user.email;
    }

    const { data, error } = await ctx.supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (error) return authError(error);
    if (!data.session?.access_token || !data.session.refresh_token) {
      return json({ error: "invalid_credentials" }, 401);
    }

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch {
    return json({ error: "temporary" }, 503);
  }
});
