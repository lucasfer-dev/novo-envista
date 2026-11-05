import { describe, expect, it } from "vitest";
import { classifyDocumentLoginFailure } from "./document-login-error";

describe("document login errors", () => {
  function httpError(status: number, error: string) {
    return {
      name: "FunctionsHttpError",
      context: new Response(JSON.stringify({ error }), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  it("reports invalid documents or passwords without leaking details", async () => {
    expect(await classifyDocumentLoginFailure(httpError(401, "invalid_credentials"))).toBe("invalid");
  });

  it("shows a retry instruction for throttled users", async () => {
    expect(await classifyDocumentLoginFailure(httpError(429, "rate"))).toBe("rate");
  });

  it("identifies provider errors and CAPTCHA failures", async () => {
    expect(await classifyDocumentLoginFailure(httpError(503, "temporary"))).toBe("temporary");
    expect(await classifyDocumentLoginFailure(httpError(400, "captcha"))).toBe("captcha");
    expect(await classifyDocumentLoginFailure({ name: "FunctionsFetchError" })).toBe("temporary");
  });

  it("does not blame a user for malformed edge-function payloads", async () => {
    expect(await classifyDocumentLoginFailure(null, { error: "temporary" })).toBe("temporary");
    expect(await classifyDocumentLoginFailure(null, {})).toBe("temporary");
  });
});
