import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logServerEvent, requestIdFromHeaders, safeErrorName } from "./logger";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

afterEach(() => vi.restoreAllMocks());

describe("observability foundation", () => {
  it("emits one-line structured JSON and sanitizes string fields", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logServerEvent("info", "test_event", { requestId: "abc\n123", durationMs: 42 });

    expect(info).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(info.mock.calls[0][0]));
    expect(payload.level).toBe("info");
    expect(payload.event).toBe("test_event");
    expect(payload.requestId).toBe("abc 123");
    expect(payload.durationMs).toBe(42);
  });

  it("uses forwarded request ids only when they are bounded", () => {
    expect(requestIdFromHeaders(new Headers({ "x-request-id": "req-123" }))).toBe("req-123");
    expect(requestIdFromHeaders(new Headers({ "x-request-id": "x".repeat(121) }))).not.toBe("x".repeat(121));
  });

  it("logs only the error class helper, not a raw stack", () => {
    expect(safeErrorName(new TypeError("secret message"))).toBe("TypeError");
    expect(safeErrorName("failure")).toBe("UnknownError");
  });

  it("provides health, safe scanner telemetry and branded recovery pages", () => {
    const health = read("app/api/health/route.ts");
    const competitions = read("app/api/competitions/route.ts");
    const routeError = read("app/error.tsx");
    const globalError = read("app/global-error.tsx");
    const notFound = read("app/not-found.tsx");

    expect(health).toContain('"Cache-Control": "no-store"');
    expect(health).toContain('"X-Request-ID"');
    expect(competitions).toContain('logServerEvent("error", "competitions_scan_failure"');
    expect(competitions).not.toContain("error instanceof Error ? error.message");
    expect(routeError).toContain("Tentar novamente");
    expect(globalError).toContain("client_global_error");
    expect(notFound).toContain("Erro 404");
  });
});
