export type LogLevel = "info" | "warn" | "error";

type SafeLogValue = string | number | boolean | null | undefined;
export type SafeLogFields = Record<string, SafeLogValue>;

const MAX_VALUE_LENGTH = 240;

function cleanValue(value: SafeLogValue) {
  if (typeof value !== "string") return value ?? null;
  return value.replace(/[\r\n\t]+/g, " ").slice(0, MAX_VALUE_LENGTH);
}

/**
 * Structured server logging for Vercel/runtime log drains.
 *
 * Callers must pass operational metadata only (ids, counters, route names,
 * durations and error classes). Never pass message bodies, emails, names,
 * tokens, cookies or other user-provided content.
 */
export function logServerEvent(level: LogLevel, event: string, fields: SafeLogFields = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event: event.slice(0, 100),
    ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key.slice(0, 80), cleanValue(value)])),
  };

  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function requestIdFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-request-id")?.trim();
  if (forwarded && forwarded.length <= 120) return forwarded;
  return crypto.randomUUID();
}

export function safeErrorName(error: unknown) {
  return error instanceof Error ? error.name.slice(0, 100) : "UnknownError";
}
