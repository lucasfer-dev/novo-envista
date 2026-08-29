import { afterEach, describe, expect, it } from "vitest";
import { getSupabaseConfig } from "@/lib/supabase/config";

const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;

  if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
});

describe("public Supabase configuration", () => {
  it("keeps the production web client usable when Vercel env vars are absent", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const config = getSupabaseConfig();
    expect(config.url).toBe("https://yeqdalgzuutbputhjvwt.supabase.co");
    expect(config.publishableKey).toMatch(/^sb_publishable_/);
  });

  it("prefers valid environment variables for rotation", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://rotated.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rotated_key";

    expect(getSupabaseConfig()).toEqual({
      url: "https://rotated.supabase.co",
      publishableKey: "sb_publishable_rotated_key",
    });
  });

  it("rejects malformed configured values instead of silently falling back", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://unsafe.example";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_valid_shape";

    expect(() => getSupabaseConfig()).toThrow(/HTTPS/);
  });
});
