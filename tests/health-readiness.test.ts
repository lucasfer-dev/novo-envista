import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/health/route";

afterEach(() => vi.unstubAllGlobals());

describe("health readiness", () => {
  it("only succeeds when Auth and REST are healthy", async () => {
    const fetcher = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const result = await GET(new NextRequest("https://useenvista.com.br/api/health"));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ status: "ok" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("marks failed DB as degraded", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      new Response("{}", { status: url.includes("/rest/v1/") ? 503 : 200 })));
    const result = await GET(new NextRequest("https://useenvista.com.br/api/health"));
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ status: "degraded" });
  });
  it("hides upstream failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/auth/v1/")) throw new Error("sensitive upstream text");
      return new Response("{}", { status: 200 });
    }));
    const result = await GET(new NextRequest("https://useenvista.com.br/api/health"));
    expect(result.status).toBe(503);
    expect(JSON.stringify(await result.json())).not.toContain("sensitive upstream text");
  });
});
