import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { guardUnsafeRequest } from "./request-rate-limit";

function request(path: string, ip: string, origin = "https://novo-envista.vercel.app") {
  return new NextRequest(`https://novo-envista.vercel.app${path}`, {
    method: "POST",
    headers: {
      origin,
      "sec-fetch-site": origin === "https://novo-envista.vercel.app" ? "same-origin" : "cross-site",
      "x-forwarded-for": ip,
    },
  });
}

describe("request abuse guard", () => {
  it("rejects cross-site unsafe requests", () => {
    const response = guardUnsafeRequest(request("/login", "203.0.113.10", "https://evil.example"));
    expect(response?.status).toBe(403);
  });

  it("rate limits repeated login posts per client IP", () => {
    const ip = "203.0.113.11";
    for (let index = 0; index < 10; index += 1) {
      expect(guardUnsafeRequest(request("/login", ip))).toBeNull();
    }
    const blocked = guardUnsafeRequest(request("/login", ip));
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("does not throttle safe GET navigation", () => {
    const safe = new NextRequest("https://novo-envista.vercel.app/login", {
      method: "GET",
      headers: { "x-forwarded-for": "203.0.113.12" },
    });
    expect(guardUnsafeRequest(safe)).toBeNull();
  });
});
