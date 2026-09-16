export type ProductRole = "participant" | "investor";
export type DeclaredAgeBand = "child" | "adolescent" | "adult";
export type PrivateDocumentKind = "cpf" | "cnpj";

export const INTERNAL_TERMS_VERSION = "2026-09-15-v2";
export const INTERNAL_PRIVACY_VERSION = "2026-09-16-v2";
export const MIN_PASSWORD_LENGTH = 12;

const PARTICIPANT_ROUTE_ROOTS = [
  "/home",
  "/learn",
  "/social",
  "/explore",
  "/participants",
  "/investors",
  "/activity",
  "/insights",
  "/interests",
  "/messages",
  "/notifications",
  "/settings",
  "/teams",
  "/projects",
  "/workspace",
  "/competitions",
  "/calendar",
] as const;

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

export function normalizePrivateDocument(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "");
}

export function normalizeCpf(value: unknown) {
  return normalizePrivateDocument(value);
}

export function isValidCpf(value: unknown) {
  const cpf = normalizePrivateDocument(value);
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

export function isValidCnpj(value: unknown) {
  const cnpj = normalizePrivateDocument(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (first !== Number(cnpj[12])) return false;
  const second = calculateDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return second === Number(cnpj[13]);
}

export function privateDocumentKind(value: unknown): PrivateDocumentKind | null {
  const normalized = normalizePrivateDocument(value);
  if (normalized.length === 11 && isValidCpf(normalized)) return "cpf";
  if (normalized.length === 14 && isValidCnpj(normalized)) return "cnpj";
  return null;
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
  return role === "investor" ? "/investor" : "/home";
}

export function pathAllowedForRole(path: string, role: ProductRole) {
  if (role === "investor") return path === "/investor" || path.startsWith("/investor/");
  if (path === "/app" || path.startsWith("/app/")) return true;
  return PARTICIPANT_ROUTE_ROOTS.some((root) => path === root || path.startsWith(`${root}/`));
}
