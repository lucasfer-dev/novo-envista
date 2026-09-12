import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalKey = process.env.SERPRO_CPF_CONSUMER_KEY;
const originalSecret = process.env.SERPRO_CPF_CONSUMER_SECRET;
const originalTokenUrl = process.env.SERPRO_TOKEN_URL;
const originalBaseUrl = process.env.SERPRO_CPF_BASE_URL;

beforeEach(() => {
  vi.resetModules();
  process.env.SERPRO_CPF_CONSUMER_KEY = "test-key";
  process.env.SERPRO_CPF_CONSUMER_SECRET = "test-secret";
  process.env.SERPRO_TOKEN_URL = "https://serpro.test/token";
  process.env.SERPRO_CPF_BASE_URL = "https://serpro.test/consulta-cpf-df/v3";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalKey === undefined) delete process.env.SERPRO_CPF_CONSUMER_KEY;
  else process.env.SERPRO_CPF_CONSUMER_KEY = originalKey;
  if (originalSecret === undefined) delete process.env.SERPRO_CPF_CONSUMER_SECRET;
  else process.env.SERPRO_CPF_CONSUMER_SECRET = originalSecret;
  if (originalTokenUrl === undefined) delete process.env.SERPRO_TOKEN_URL;
  else process.env.SERPRO_TOKEN_URL = originalTokenUrl;
  if (originalBaseUrl === undefined) delete process.env.SERPRO_CPF_BASE_URL;
  else process.env.SERPRO_CPF_BASE_URL = originalBaseUrl;
});

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifierWithCpfResponse(body: unknown, status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(response({ access_token: "token", expires_in: 3600 }))
    .mockResolvedValueOnce(response(body, status));
  vi.stubGlobal("fetch", fetchMock);
  const { verifyCpfWithSerpro } = await import("./serpro-cpf");
  return { result: await verifyCpfWithSerpro("40442820135", "1970-11-14"), fetchMock };
}

describe("Serpro CPF v3 verification", () => {
  it("accepts only a matching regular CPF response", async () => {
    const { result, fetchMock } = await verifierWithCpfResponse({
      ni: "40442820135",
      nome: "Pessoa de Teste",
      situacao: { codigo: "0", descricao: "Regular" },
      nascimento: "14111970",
    });

    expect(result).toEqual({ ok: true, ageBand: "adult" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://serpro.test/consulta-cpf-df/v3/cpf/40442820135/14111970",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("rejects a response whose birth date does not match", async () => {
    const { result } = await verifierWithCpfResponse({
      ni: "40442820135",
      situacao: { codigo: "0", descricao: "Regular" },
      nascimento: "15111970",
    });
    expect(result).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a non-regular CPF even when CPF and birth date match", async () => {
    const { result } = await verifierWithCpfResponse({
      ni: "40442820135",
      situacao: { codigo: "2", descricao: "Suspensa" },
      nascimento: "14111970",
    });
    expect(result).toEqual({ ok: false, reason: "non_regular" });
  });

  it("fails closed when server credentials are unavailable", async () => {
    delete process.env.SERPRO_CPF_CONSUMER_KEY;
    delete process.env.SERPRO_CPF_CONSUMER_SECRET;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { verifyCpfWithSerpro } = await import("./serpro-cpf");
    const result = await verifyCpfWithSerpro("40442820135", "1970-11-14");
    expect(result).toEqual({ ok: false, reason: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
