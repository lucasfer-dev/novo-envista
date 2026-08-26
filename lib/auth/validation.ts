export type ProductRole = "participant" | "investor";
export type DeclaredAgeBand = "child" | "adolescent" | "adult";

export const INTERNAL_TERMS_VERSION = "internal-2026-08-26-v2";
export const INTERNAL_PRIVACY_VERSION = "internal-2026-08-26-v2";
export const MIN_PASSWORD_LENGTH = 12;

export function safeInternalPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (/[\\\r\n\0]/.test(path)) return fallback;
  return path;
}

export function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/[._-]{2,}/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
}

export function isValidUsername(value: string) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value);
}

export function isValidEmail(value: unknown) {
  if (typeof value !== "string" || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validatePassword(value: unknown) {
  if (typeof value !== "string") return "A senha é obrigatória.";
  if (value.length < MIN_PASSWORD_LENGTH) return `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (value.length > 128) return "A senha deve ter no máximo 128 caracteres.";
  return null;
}

export function parseProductRole(value: unknown): ProductRole {
  return value === "investor" ? "investor" : "participant";
}

export function parseAgeBand(value: unknown): DeclaredAgeBand | null {
  if (value === "child" || value === "adolescent" || value === "adult") return value;
  return null;
}

export function homeForRole(role: ProductRole) {
  return role === "investor" ? "/investor" : "/app";
}

export function pathAllowedForRole(path: string, role: ProductRole) {
  if (role === "investor") return path === "/investor" || path.startsWith("/investor/");
  return path === "/app" || path.startsWith("/app/");
}
