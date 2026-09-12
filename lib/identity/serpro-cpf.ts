import "server-only";

import { Buffer } from "node:buffer";
import { ageBandFromBirthDate, formatBirthDateForSerpro, type AgeBand } from "@/lib/identity/birth-date";

const DEFAULT_TOKEN_URL = "https://gateway.apiserpro.serpro.gov.br/token";
const DEFAULT_CPF_BASE_URL = "https://gateway.apiserpro.serpro.gov.br/consulta-cpf-df/v3";
const REQUEST_TIMEOUT_MS = 8_000;

type VerificationResult =
  | { ok: true; ageBand: AgeBand }
  | { ok: false; reason: "invalid_birth_date" | "mismatch" | "non_regular" | "unavailable" };

type TokenCache = { value: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

function credentials() {
  const consumerKey = process.env.SERPRO_CPF_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.SERPRO_CPF_CONSUMER_SECRET?.trim();
  if (!consumerKey || !consumerSecret) return null;
  return { consumerKey, consumerSecret };
}

async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.value;
  }

  const auth = credentials();
  if (!auth) return null;

  const basic = Buffer.from(`${auth.consumerKey}:${auth.consumerSecret}`, "utf8").toString("base64");
  const response = await fetch(process.env.SERPRO_TOKEN_URL?.trim() || DEFAULT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { access_token?: string; expires_in?: number | string };
  if (!payload.access_token) return null;

  const expiresIn = Math.max(60, Number(payload.expires_in) || 3600);
  tokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  };
  return payload.access_token;
}

async function queryCpf(cpf: string, birthDate: string, token: string) {
  const baseUrl = (process.env.SERPRO_CPF_BASE_URL?.trim() || DEFAULT_CPF_BASE_URL).replace(/\/$/, "");
  return fetch(`${baseUrl}/cpf/${encodeURIComponent(cpf)}/${encodeURIComponent(birthDate)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function verifyCpfWithSerpro(cpf: string, birthDateIso: string): Promise<VerificationResult> {
  const normalizedCpf = cpf.replace(/\D/g, "");
  if (normalizedCpf.length !== 11) return { ok: false, reason: "mismatch" };

  const serproBirthDate = formatBirthDateForSerpro(birthDateIso);
  const ageBand = ageBandFromBirthDate(birthDateIso);
  if (!serproBirthDate || !ageBand) return { ok: false, reason: "invalid_birth_date" };
  if (!credentials()) return { ok: false, reason: "unavailable" };

  try {
    let token = await getAccessToken();
    if (!token) return { ok: false, reason: "unavailable" };

    let response = await queryCpf(normalizedCpf, serproBirthDate, token);
    if (response.status === 401) {
      token = await getAccessToken(true);
      if (!token) return { ok: false, reason: "unavailable" };
      response = await queryCpf(normalizedCpf, serproBirthDate, token);
    }

    if ([400, 404, 422].includes(response.status)) return { ok: false, reason: "mismatch" };
    if (!response.ok) return { ok: false, reason: "unavailable" };

    const payload = (await response.json()) as {
      ni?: string;
      nascimento?: string;
      situacao?: { codigo?: string | number; descricao?: string };
    };

    const returnedCpf = String(payload.ni ?? "").replace(/\D/g, "");
    const returnedBirthDate = String(payload.nascimento ?? "").replace(/\D/g, "");
    if (returnedCpf !== normalizedCpf || returnedBirthDate !== serproBirthDate) {
      return { ok: false, reason: "mismatch" };
    }

    const code = String(payload.situacao?.codigo ?? "").trim();
    const description = String(payload.situacao?.descricao ?? "").trim().toLocaleLowerCase("pt-BR");
    if (code !== "0" || (description && description !== "regular")) {
      return { ok: false, reason: "non_regular" };
    }

    return { ok: true, ageBand };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
