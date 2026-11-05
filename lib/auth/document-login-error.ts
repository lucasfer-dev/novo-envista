/**
 * Supabase Edge Functions put non-2xx responses in FunctionsHttpError.context.
 * Keep bad credentials distinct from rate limits, provider outages and CAPTCHA.
 * Never include the entered identifier or password in the returned code/logs.
 */
export type DocumentLoginFailure = "invalid" | "rate" | "captcha" | "temporary";

type ErrorRecord = {
  context?: unknown;
  status?: unknown;
  name?: unknown;
};

function serviceCode(value: unknown): string {
  if (!value || typeof value !== "object" || !("error" in value)) return "";
  const code = (value as { error?: unknown }).error;
  return typeof code === "string" ? code.toLowerCase() : "";
}

export async function classifyDocumentLoginFailure(
  error: unknown,
  data?: unknown,
): Promise<DocumentLoginFailure> {
  let code = serviceCode(data);
  const record = (error && typeof error === "object" ? error : {}) as ErrorRecord;
  const context = record.context;
  const response = typeof Response !== "undefined" && context instanceof Response
    ? context
    : null;

  let status = typeof record.status === "number" ? record.status : response?.status;
  if (response) {
    try {
      code ||= serviceCode(await response.clone().json());
    } catch {
      // An invalid response body must not reveal provider internals.
    }
  }

  if (code === "rate" || status === 429) return "rate";
  if (code === "captcha" || code.includes("captcha")) return "captcha";
  if (code === "temporary" || (typeof status === "number" && status >= 500)) return "temporary";
  if (record.name === "FunctionsFetchError" || record.name === "FunctionsRelayError") return "temporary";
  if (code === "invalid_credentials" || status === 401 || status === 403) return "invalid";
  // A malformed successful payload is an unavailable backend, not a bad password.
  if (!error) return "temporary";
  return "invalid";
}
