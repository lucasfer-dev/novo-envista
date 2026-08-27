import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("usa a URL pública explícita em produção", () => {
    expect(
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://novo-envista.vercel.app/",
        VERCEL_PROJECT_PRODUCTION_URL: "novo-envista.vercel.app",
      }),
    ).toBe("https://novo-envista.vercel.app");
  });

  it("ignora localhost em produção e usa o domínio de produção da Vercel", () => {
    expect(
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        VERCEL_PROJECT_PRODUCTION_URL: "novo-envista.vercel.app",
        VERCEL_URL: "novo-envista-abc.vercel.app",
      }),
    ).toBe("https://novo-envista.vercel.app");
  });

  it("usa a URL do próprio preview em deploy de preview", () => {
    expect(
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SITE_URL: "https://novo-envista.vercel.app",
        VERCEL_URL: "novo-envista-preview.vercel.app",
      }),
    ).toBe("https://novo-envista-preview.vercel.app");
  });

  it("mantém localhost no desenvolvimento local", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000/" })).toBe(
      "http://localhost:3000",
    );
  });

  it("falha fechado em produção se não houver URL pública", () => {
    expect(() =>
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toThrow(/URL pública/);
  });
});
