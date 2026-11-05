import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { guardUnsafeRequest } from "./request-rate-limit";

function request(
  path: string,
  ip: string,
  origin = "https://novo-envista.vercel.app",
  method = "POST",
) {
  return new NextRequest(`https://novo-envista.vercel.app${path}`, {
    method,
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
    for (let index = 0; index < 120; index += 1) {
      expect(guardUnsafeRequest(request("/login", ip))).toBeNull();
    }
    const blocked = guardUnsafeRequest(request("/login", ip));
    expect(blocked?.status).toBe(303);
    expect(blocked?.headers.get("location")).toContain("/login?error=rate");
    expect(Number(blocked?.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("allows a school cohort to register from one shared IP", () => {
    const ip = "203.0.113.14";
    for (let index = 0; index < 100; index += 1) {
      expect(guardUnsafeRequest(request("/register", ip))).toBeNull();
    }
    const blocked = guardUnsafeRequest(request("/register", ip));
    expect(blocked?.status).toBe(303);
    expect(blocked?.headers.get("location")).toContain("/register?error=rate");
  });

  it("keeps admin login on a tighter limit", () => {
    const ip = "203.0.113.15";
    for (let index = 0; index < 10; index += 1) {
      expect(guardUnsafeRequest(request("/admin/login", ip))).toBeNull();
    }
    expect(guardUnsafeRequest(request("/admin/login", ip))?.status).toBe(429);
  });

  it("does not throttle ordinary safe GET navigation", () => {
    const safe = request("/login", "203.0.113.12", "https://novo-envista.vercel.app", "GET");
    expect(guardUnsafeRequest(safe)).toBeNull();
  });

  it("rate limits the expensive competitions GET endpoint", () => {
    const ip = "203.0.113.13";
    for (let index = 0; index < 60; index += 1) {
      expect(guardUnsafeRequest(request("/api/competitions", ip, "https://novo-envista.vercel.app", "GET"))).toBeNull();
    }
    const blocked = guardUnsafeRequest(
      request("/api/competitions", ip, "https://novo-envista.vercel.app", "GET"),
    );
    expect(blocked?.status).toBe(429);
  });
});
